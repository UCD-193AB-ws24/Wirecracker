import express from 'express';
import cors from 'cors';
import { supabase, handleFileRecord } from './utils.js';

const router = express.Router();
router.use(cors());
router.use(express.json());

// Endpoint to save stimulation data
router.post('/save-stimulation', async (req, res) => {
  try {
    console.log('Received stimulation save request', req.body);
    
    const { electrodes, planOrder, isFunctionalMapping, fileId, fileName, creationDate, modifiedDate } = req.body;
    
    if (!electrodes) {
      return res.status(400).json({ success: false, error: 'Missing electrodes data' });
    }
    
    if (!planOrder) {
      return res.status(400).json({ success: false, error: 'Missing plan order data' });
    }
    
    if (fileId === undefined || fileId === null) {
      return res.status(400).json({ success: false, error: 'Missing file ID' });
    }
    
    if (isFunctionalMapping === undefined) {
      return res.status(400).json({ success: false, error: 'Missing isFunctionalMapping flag' });
    }
    
    console.log(`Processing stimulation save request for file ID: ${fileId}`);

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
    
    // Check for existing stimulation with this file_id
    const { data: existingData, error: checkError } = await supabase
      .from('stimulation')
      .select('id')
      .eq('file_id', fileId);
      
    if (checkError) {
      console.error('Error checking existing stimulation:', checkError);
    } else if (existingData && existingData.length > 0) {
      console.log(`Found existing stimulation with file_id ${fileId}, updating...`);
      const { error: updateError } = await supabase
        .from('stimulation')
        .update({
          stimulation_data: electrodes,
          plan_order: planOrder,
          is_mapping: isFunctionalMapping
        })
        .eq('file_id', fileId);
        
      if (updateError) {
        console.error('Error updating stimulation:', updateError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to update existing stimulation: ${updateError.message}`
        });
      }
      console.log('Successfully updated stimulation');
    } else {
      // Insert new stimulation record
      console.log('Creating new stimulation record...');
      const { error: insertError } = await supabase
        .from('stimulation')
        .insert({
          file_id: fileId,
          stimulation_data: electrodes,
          plan_order: planOrder,
          is_mapping: isFunctionalMapping
        });
        
      if (insertError) {
        console.error('Error inserting stimulation:', insertError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to save stimulation: ${insertError.message}`
        });
      }
      console.log('Successfully created new stimulation');
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Stimulation data saved successfully',
      fileId: fileId
    });
  } catch (error) {
    console.error('Error in save-stimulation endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

export default router; 