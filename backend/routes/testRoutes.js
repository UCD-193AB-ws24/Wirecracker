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
    
    // Check for existing test selection with this file_id
    const { data: existingData, error: checkError } = await supabase
      .from('test_selection')
      .select('id')
      .eq('file_id', fileId);
      
    if (checkError) {
      console.error('Error checking existing test selection:', checkError);
    } else if (existingData && existingData.length > 0) {
      console.log(`Found existing test selection with file_id ${fileId}, updating...`);
      const { error: updateError } = await supabase
        .from('test_selection')
        .update({
          tests: tests,
          contacts: contacts
        })
        .eq('file_id', fileId);
        
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
      fileId: fileId
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

export default router;
