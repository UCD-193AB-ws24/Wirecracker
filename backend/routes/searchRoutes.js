import express from 'express';
import { supabase } from './utils.js';

const router = express.Router();

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
            )
          )
        )
      `);

    if (query) {
      cortQuery = cortQuery.ilike('name', `%${query}%`);
    }

    if (hemisphere) {
      cortQuery = cortQuery.eq('hemisphere', hemisphere);
    }

    if (lobe) {
      cortQuery = cortQuery.eq('lobe', lobe);
    }

    const { data: cortData, error: cortError } = await cortQuery;
    if (cortError) throw cortError;
    results.cort = cortData || [];

    // Search gm table with filters
    let gmQuery = supabase
      .from('gm')
      .select(`
        *,
        cort_gm(
          cort(*)
        )
      `);

    if (query) {
      gmQuery = gmQuery.ilike('name', `%${query}%`);
    }

    if (hemisphere) {
      gmQuery = gmQuery.eq('hemisphere', hemisphere);
    }

    if (lobe) {
      gmQuery = gmQuery.eq('lobe', lobe);
    }

    const { data: gmData, error: gmError } = await gmQuery;
    if (gmError) throw gmError;
    results.gm = gmData || [];

    // Search functions table
    let functionsQuery = supabase
      .from('function')
      .select('*');

    if (query) {
      functionsQuery = functionsQuery.ilike('name', `%${query}%`);
    }

    const { data: functionsData, error: functionsError } = await functionsQuery;
    if (functionsError) throw functionsError;
    results.functions = functionsData || [];

    // Search tests table
    let testsQuery = supabase
      .from('test')
      .select('*');

    if (query) {
      testsQuery = testsQuery.ilike('name', `%${query}%`);
    }

    const { data: testsData, error: testsError } = await testsQuery;
    if (testsError) throw testsError;
    results.tests = testsData || [];

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 