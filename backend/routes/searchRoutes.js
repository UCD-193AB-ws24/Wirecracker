import express from 'express';
import cors from 'cors';
import { supabase } from './utils.js';

const router = express.Router();
router.use(cors());
router.use(express.json());

router.post("/search", async (req, res) => {
  try {
    const { query, hemisphere, lobe } = req.body;

    // Initialize result structure
    const results = {
      cort: [],
      gm: [],
      functions: [],
      tests: []
    };

    // Search cort table with filters
    let cortQuery = supabase
      .from('cort')
      .select(`
        *,
        cort_gm(
          gm(
            *,
            cort_gm(
              cort(*)
            ),
            gm_function(
              function(*)
            )
          )
        )
      `);

    // filtering
    if (query) {
      cortQuery = cortQuery.or(`name.ilike.%${query}%,acronym.ilike.%${query}%,lobe.ilike.%${query}%`);
    }
    if (hemisphere?.length) {
      cortQuery = cortQuery.in('hemisphere', hemisphere.map(h => h === 'left' ? 'l' : 'r'));
    }
    if (lobe?.length) {
      cortQuery = cortQuery.or(lobe.map(l => `lobe.ilike.%${l}%`).join(','));
    }

    const { data: cortData, error: cortError } = await cortQuery;
    if (cortError) throw cortError;
    results.cort = cortData || [];

    // Process cort data and collect GM ids
    results.cort.forEach(cort => {
      cort.cort_gm?.forEach(cg => {
        if (cg.gm && !results.gm.some(g => g.id === cg.gm.id)) {
          results.gm.push({
            ...cg.gm,
            cort_gm: [{ cort: cort }]
          });
        }
      });
    });

    // Combined search for GM, functions, and tests when query exists
    if (query) {
      // Search GM, functions, and tests in parallel
      const [gmData, funcData, testData] = await Promise.all([
        supabase
          .from('gm')
          .select(`
            *,
            cort_gm(
              cort(*)
            ),
            gm_function(
              function(*)
            )
          `)
          .or(`name.ilike.%${query}%,acronym.ilike.%${query}%`),

        supabase
          .from('function')
          .select(`
            *,
            gm_function(
              gm(*)
            ),
            function_test(
              test(*)
            )
          `)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`),

        supabase
          .from('test')
          .select(`
            *,
            function_test(
              function(*)
            )
          `)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      ]);

      // Process test results
      const relatedFuncIds = new Set();
      if (!testData.error) {
        testData.data?.forEach(test => {
          if (!results.tests.some(t => t.id === test.id)) {
            results.tests.push(test);
            // Collect Function ids from function_test
            test.function_test?.forEach(ft => {
              if (ft.function?.id) relatedFuncIds.add(ft.function.id);
            })
          }
        });
      }

      // Process function results and collect related GM ids
      const relatedGmIds = new Set();
      if (!funcData.error) {
        funcData.data?.forEach(func => {
          if (!results.functions.some(f => f.id === func.id)) {
            results.functions.push(func);
            // Collect GM ids from function relationships
            func.gm_function?.forEach(gf => {
              if (gf.gm?.id) relatedGmIds.add(gf.gm.id);
            });
          }
        });
      }

      // Process GM results
      if (!gmData.error) {
        gmData.data?.forEach(gm => {
          if (!results.gm.some(g => g.id === gm.id)) {
            results.gm.push(gm);
          }
        });
      }

      // Fetch any missing Functions that are related to found tests
      if (relatedFuncIds.size > 0) {
        const funcIdsToFetch = Array.from(relatedFuncIds).filter(id =>
          !results.gm.some(g => g.id === id)
        );

        if (funcIdsToFetch.length > 0) {
          const { data: missingFuncs, error: missingFuncError } = await supabase
            .from('function')
            .select(`
              *,
              function_test(
                test(*)
              ),
              gm_function(
                function(*)
              )
            `)
            .in('id', funcIdsToFetch);

          if (!missingFuncError) {
            missingFuncs?.forEach(func => {
              if (!results.functions.some(f => f.id === func.id)) {
                results.functions.push(func);
              }
            });
          }
        }
      }

      // Fetch any missing GMs that are related to found functions
      if (relatedGmIds.size > 0) {
        const gmIdsToFetch = Array.from(relatedGmIds).filter(id =>
          !results.gm.some(g => g.id === id)
        );

        if (gmIdsToFetch.length > 0) {
          const { data: missingGms, error: missingGmError } = await supabase
            .from('gm')
            .select(`
              *,
              cort_gm(
                cort(*)
              ),
              gm_function(
                function(*)
              )
            `)
            .in('id', gmIdsToFetch);

          if (!missingGmError) {
            missingGms?.forEach(gm => {
              if (!results.gm.some(g => g.id === gm.id)) {
                results.gm.push(gm);
              }
            });
          }
        }
      }
    }

    // Get all unique GM ids now (from cort, direct search, and function relationships)
    const allGmIds = [...new Set(results.gm.map(g => g.id))];



    // Fetch all relationships in parallel
    // cort from GM and function from GM
    const [gmFunctions, cortGM] = await Promise.all([
      allGmIds.length > 0 ? supabase
        .from('gm_function')
        .select(`
          *,
          function(
            *,
            gm_function(
              gm(*)
            ),
            function_test(
              test(*)
            )
          )
        `)
        .in('gm_id', allGmIds) : { data: null, error: null },

      allGmIds.length > 0 ? supabase
        .from('cort_gm')
        .select(`
          *,
          cort(
            *,
            cort_gm(
              gm(*)
            )
          )
        `)
        .in('gm_id', allGmIds) : { data: null, error: null },
    ]);

    // Process gm_function relationships
    if (!gmFunctions.error && gmFunctions.data) {
      gmFunctions.data.forEach(gf => {
        if (gf.function && !results.functions.some(f => f.id === gf.function.id)) {
          results.functions.push(gf.function);
        }
      });
    }

    // Process cort_gm relationships
    if (!cortGM.error && cortGM.data) {
      cortGM.data.forEach(cg => {
        if (cg.cort && !results.cort.some(c => c.id === cg.cort.id)) {
          results.cort.push(cg.cort);
        }
      });
    }

    // Get all unique function ids
    const allFunctionIds = [...new Set(results.functions.map(f => f.id))];

    // test from function
    const [functionTests] = await Promise.all([
      allFunctionIds.length > 0 ? supabase
        .from('function_test')
        .select(`
          *,
          test(
            *,
            function_test(
              function(*)
            )
          )
        `)
        .in('function_id', allFunctionIds) : { data: null, error: null },
    ])

    // Process function_test relationships
    if (!functionTests.error && functionTests.data) {
      functionTests.data.forEach(ft => {
        if (ft.test && !results.tests.some(t => t.id === ft.test.id)) {
          results.tests.push(ft.test);
        }
      });
    }

    // Filter relationships to only include items that exist in results
    results.gm.forEach(gm => {
      if (gm.cort_gm) {
        gm.cort_gm = gm.cort_gm.filter(cg =>
          results.cort.some(c => c.id === cg.cort?.id)
        );
      }
      if (gm.gm_function) {
        gm.gm_function = gm.gm_function.filter(gf =>
          results.functions.some(f => f.id === gf.function?.id)
        );
      }
    });

    results.functions.forEach(func => {
      if (func.gm_function) {
        func.gm_function = func.gm_function.filter(gf =>
          results.gm.some(g => g.id === gf.gm?.id)
        );
      }
      if (func.function_test) {
        func.function_test = func.function_test.filter(ft =>
          results.tests.some(t => t.id === ft.test?.id)
        );
      }
    });

    results.tests.forEach(test => {
      if (test.function_test) {
        test.function_test = test.function_test.filter(ft =>
          results.functions.some(f => f.id === ft.function?.id)
        );
      }
    });

    res.json(results);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Error performing search" });
  }
});

router.post('/suggest', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query parameters are required' });
        }

        const { data: cortData, error: cortError } = await supabase
            .from('cort')
            .select('lobe, name, acronym')
            .or(`lobe.ilike.%${query}%,name.ilike.%${query}%,acronym.ilike.%${query}%`)
            .limit(15);

        if (cortError) throw cortError;

        const { data: gmData, error: gmError } = await supabase
            .from('gm')
            .select('name, acronym')
            .or(`name.ilike.%${query}%,acronym.ilike.%${query}%`)
            .limit(10);

        if (gmError) throw gmError;

        const suggestions = new Set();
        cortData.forEach(item => {
            if (item.lobe?.includes(query)) suggestions.add(item.lobe);
            if (item.name?.includes(query)) suggestions.add(item.name);
            if (item.acronym?.includes(query)) suggestions.add(item.acronym);
        });
        gmData.forEach(item => {
            if (item.name?.includes(query)) suggestions.add(item.name);
            if (item.acronym?.includes(query)) suggestions.add(item.acronym);
        });

        res.json({ suggestions: [...suggestions].slice(0, 25) });
    } catch (err) {
        console.error("Suggestion error:", err);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

router.get("/lobe-options", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("cort")
      .select("lobe")
      .not("lobe", "is", null)
      .not("lobe", "eq", "")
      .order("lobe", { ascending: true });

    if (error) throw error;

    const uniqueLobes = [...new Set(data.map(item => item.lobe))].filter(Boolean);

    res.json({ lobes: uniqueLobes });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Error fetching lobe options" });
  }
});

export default router;
