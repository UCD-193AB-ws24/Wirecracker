import express from 'express';
import cors from 'cors';
import { supabase, handleFileRecord } from './utils.js';

const router = express.Router();
router.use(cors());
router.use(express.json());

// Endpoint to save test selection data
router.post('/save-test-selection', async (req, res) => {
  try {
    console.log('Received test selection save request', req.body);
    
    const { tests, contacts, fileId, fileName, creationDate, modifiedDate, patientId } = req.body;
    
    if (!tests) {
      return res.status(400).json({ success: false, error: 'Missing tests data' });
    }
    
    if (!contacts) {
      return res.status(400).json({ success: false, error: 'Missing contacts data' });
    }
    
    if (fileId === undefined || fileId === null) {
      return res.status(400).json({ success: false, error: 'Missing file ID' });
    }

    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Missing patient ID' });
    }

    // Handle file record
    try {
      await handleFileRecord(fileId, fileName, creationDate, modifiedDate, req.headers.authorization, patientId);
    } catch (error) {
      console.error('Error saving file metadata:', error);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to save file metadata: ${error.message}`
      });
    }
    
    // Check for existing test selection with this patient_id
    const { data: existingFile, error: fileError } = await supabase
      .from('files')
      .select('file_id')
      .eq('patient_id', patientId)
      .ilike('filename', '%test%')
      .single();
      
    if (fileError && fileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing test selection:', fileError);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to check existing test selection: ${fileError.message}`
      });
    }

    if (existingFile && existingFile.file_id) {
      // Get the existing test selection data
      const { data: existingTestSelection, error: testSelectionError } = await supabase
        .from('test_selection')
        .select('*')
        .eq('file_id', existingFile.file_id)
        .single();

      if (testSelectionError && testSelectionError.code !== 'PGRST116') {
        console.error('Error fetching existing test selection:', testSelectionError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to fetch existing test selection: ${testSelectionError.message}`
        });
      }

      if (existingTestSelection) {
        // Update the test selection record
        const { error: updateError } = await supabase
          .from('test_selection')
          .update({
            tests: tests,
            contacts: contacts
          })
          .eq('file_id', existingFile.file_id);
          
        if (updateError) {
          console.error('Error updating test selection:', updateError);
          return res.status(500).json({ 
            success: false, 
            error: `Failed to update existing test selection: ${updateError.message}`
          });
        }
        console.log('Successfully updated test selection');
      } else {
        // Insert new test selection record
        console.log('Creating new test selection record...');
        const { error: insertError } = await supabase
          .from('test_selection')
          .insert({
            file_id: existingFile.file_id,
            tests: tests,
            contacts: contacts
          });
          
        if (insertError) {
          console.error('Error inserting test selection:', insertError);
          return res.status(500).json({ 
            success: false, 
            error: `Failed to save test selection: ${insertError.message}`
          });
        }
        console.log('Successfully created new test selection');
      }
    } else {
      // Insert new test selection record
      console.log('Creating new test selection record...');
      const { error: insertError } = await supabase
        .from('test_selection')
        .insert({
          file_id: fileId,
          tests: tests,
          contacts: contacts
        });
        
      if (insertError) {
        console.error('Error inserting test selection:', insertError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to save test selection: ${insertError.message}`
        });
      }
      console.log('Successfully created new test selection');
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Test selection data saved successfully',
      fileId: existingFile ? existingFile.file_id : fileId
    });
  } catch (error) {
    console.error('Error in save-test-selection endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

router.get('/get-tests', async (req, res) => {
  try {
    const { data, error } = await supabase
          .from('test')
          .select(`
            *,
            function_test(
              function(
                *,
                gm_function(
                  gm(*)
                )
              )
            ),
            test_tag(
              tag(*)
            )
          `);

    if (error) throw error;

    // Transform the test data here
    const transformed_data = data.map((test) => {
      const tag = test.test_tag.map((tag) => tag.tag?.name);

      const region = test.function_test.map((func) => {
        return func.function?.gm_function.map((gm) => gm.gm?.name)
      });

      return {
        id: test.id,
        name: test.name,
        description: test.description,
        population: 20,
        disruptionRate: 50.5,
        tag: tag.filter(Boolean),
        region: region.flat(Infinity).filter(Boolean)
      }
    })

    res.json({ data: transformed_data });

  } catch (error) {
    console.error('Error in get-tests endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to get test selection by patient ID
router.get('/by-patient-test/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Missing patient ID' });
    }

    // Get the file ID for this patient's test selection
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('file_id')
      .eq('patient_id', patientId)
      .ilike('filename', '%test%')
      .single();

    if (fileError && fileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching file:', fileError);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to fetch file: ${fileError.message}`
      });
    }

    if (!fileData || !fileData.file_id) {
      return res.status(200).json({ 
        success: true,
        exists: false
      });
    }

    // Get the test selection data
    const { data: testSelectionData, error: testSelectionError } = await supabase
      .from('test_selection')
      .select('*')
      .eq('file_id', fileData.file_id)
      .single();

    if (testSelectionError && testSelectionError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching test selection:', testSelectionError);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to fetch test selection: ${testSelectionError.message}`
      });
    }

    if (!testSelectionData) {
      return res.status(200).json({ 
        success: true,
        exists: false
      });
    }

    res.status(200).json({ 
      success: true,
      exists: true,
      data: testSelectionData,
      fileId: fileData.file_id
    });
  } catch (error) {
    console.error('Error in get-test-selection-by-patient endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

export default router;
