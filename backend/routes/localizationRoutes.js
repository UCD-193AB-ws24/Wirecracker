import express from 'express';
import cors from 'cors';
import { supabase, saveLocalizationToDatabase } from './utils.js';

const router = express.Router();
router.use(cors());
router.use(express.json());

// Fetch electrode label descriptions
router.get("/electrode-label-descriptions", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("electrode_label_description")
      .select("*");
    if (error) throw error;
    res.status(200).json({ electrodeLabelDescriptions: data });
  } catch (error) {
    console.error("Error fetching electrode label descriptions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to save localization data
router.post('/save-localization', async (req, res) => {
  try {
    console.log('Received localization save request', req.body);
    
    const { electrodes, fileId } = req.body;
    
    if (!electrodes) {
      return res.status(400).json({ success: false, error: 'Missing electrodes data' });
    }
    
    if (fileId === undefined || fileId === null) {
      return res.status(400).json({ success: false, error: 'Missing file ID' });
    }
    
    if (Object.keys(electrodes).length === 0) {
      return res.status(400).json({ success: false, error: 'Electrodes data is empty' });
    }
    
    console.log(`Processing save request for file ID: ${fileId} with ${Object.keys(electrodes).length} electrodes`);
    
    // Delete existing localization records for this file_id BEFORE saving new ones
    console.log(`Checking for existing localizations with file_id: ${fileId}`);
    const { data: existingData, error: checkError } = await supabase
      .from('localization')
      .select('id')
      .eq('file_id', fileId);
      
    if (checkError) {
      console.error('Error checking existing localizations:', checkError);
    } else if (existingData && existingData.length > 0) {
      console.log(`Found ${existingData.length} existing localizations with file_id ${fileId}, deleting...`);
      const { error: deleteError } = await supabase
        .from('localization')
        .delete()
        .eq('file_id', fileId);
        
      if (deleteError) {
        console.error('Error deleting existing localizations:', deleteError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to update existing localization data: ${deleteError.message}`
        });
      }
      console.log('Successfully deleted existing localizations');
    } else {
      console.log('No existing localizations found for this file_id');
    }
    
    // Process the save operation with file ID
    await saveLocalizationToDatabase(electrodes, fileId);
    
    res.status(200).json({ 
      success: true,
      message: 'Localization data saved successfully',
      fileId: fileId
    });
  } catch (error) {
    console.error('Error in save-localization endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

export default router; 