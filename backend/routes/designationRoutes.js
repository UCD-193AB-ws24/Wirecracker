import express from 'express';
import cors from 'cors';
import { supabase, handleFileRecord } from './utils.js';

const router = express.Router();
router.use(cors());
router.use(express.json());

// Endpoint to save designation data
router.post('/save-designation', async (req, res) => {
  try {
    console.log('Received designation save request', req.body);
    
    const { designationData, localizationData, fileId, fileName, creationDate, modifiedDate } = req.body;
    
    if (!designationData) {
      return res.status(400).json({ success: false, error: 'Missing designation data' });
    }
    
    if (!localizationData) {
      return res.status(400).json({ success: false, error: 'Missing localization data' });
    }
    
    if (fileId === undefined || fileId === null) {
      return res.status(400).json({ success: false, error: 'Missing file ID' });
    }

    // Handle file record
    try {
      await handleFileRecord(fileId, fileName, creationDate, modifiedDate, req.headers.authorization);
    } catch (error) {
      console.error('Error saving file metadata:', error);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to save file metadata: ${error.message}`
      });
    }
    
    // Check for existing designation with this file_id
    const { data: existingData, error: checkError } = await supabase
      .from('designation')
      .select('id')
      .eq('file_id', fileId);
      
    if (checkError) {
      console.error('Error checking existing designation:', checkError);
    } else if (existingData && existingData.length > 0) {
      console.log(`Found existing designation with file_id ${fileId}, updating...`);
      const { error: updateError } = await supabase
        .from('designation')
        .update({
          designation_data: designationData,
          localization_data: localizationData
        })
        .eq('file_id', fileId);
        
      if (updateError) {
        console.error('Error updating designation:', updateError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to update existing designation: ${updateError.message}`
        });
      }
      console.log('Successfully updated designation');
    } else {
      // Insert new designation record
      console.log('Creating new designation record...');
      const { error: insertError } = await supabase
        .from('designation')
        .insert({
          file_id: fileId,
          designation_data: designationData,
          localization_data: localizationData
        });
        
      if (insertError) {
        console.error('Error inserting designation:', insertError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to save designation: ${insertError.message}`
        });
      }
      console.log('Successfully created new designation');
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Designation data saved successfully',
      fileId: fileId
    });
  } catch (error) {
    console.error('Error in save-designation endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

export default router; 