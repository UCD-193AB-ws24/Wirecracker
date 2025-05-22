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
    
    const { designationData, localizationData, fileId, fileName, creationDate, modifiedDate, patientId } = req.body;
    const { type } = req.query;
    
    if (!designationData) {
      return res.status(400).json({ success: false, error: 'Missing designation data' });
    }
    
    if (!localizationData) {
      return res.status(400).json({ success: false, error: 'Missing localization data' });
    }
    
    if (fileId === undefined || fileId === null) {
      return res.status(400).json({ success: false, error: 'Missing file ID' });
    }

    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Missing patient ID' });
    }

    let filename;
    if (type === 'resection') {
      filename = '%neurosurgery%';
    }
    else {  
      filename = '%epilepsy%';
    }

    // Check for existing designation with this patient_id
    const { data: existingFile, error: fileError } = await supabase
      .from('files')
      .select('file_id')
      .eq('patient_id', patientId)
      .ilike('filename', filename)
      .single();
      
    if (fileError && fileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing designation:', fileError);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to check existing designation: ${fileError.message}`
      });
    }

    if (existingFile && existingFile.file_id) {
      // Get the existing designation data
      const { data: existingDesignation, error: designationError } = await supabase
        .from('designation')
        .select('*')
        .eq('file_id', existingFile.file_id)
        .single();

      if (designationError && designationError.code !== 'PGRST116') {
        console.error('Error fetching existing designation:', designationError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to fetch existing designation: ${designationError.message}`
        });
      }

      if (existingDesignation) {
        // Compare designation data
        const isDesignationDifferent = JSON.stringify(existingDesignation.designation_data) !== JSON.stringify(designationData);
        // Compare localization data
        const isLocalizationDifferent = JSON.stringify(existingDesignation.localization_data) !== JSON.stringify(localizationData);

        // Only update if there are changes
        if (isDesignationDifferent || isLocalizationDifferent) {
          // Handle file record update with new modified date
          try {
            await handleFileRecord(fileId, fileName, creationDate, modifiedDate, req.headers.authorization, patientId);
          } catch (error) {
            console.error('Error saving file metadata:', error);
            return res.status(500).json({ 
              success: false, 
              error: `Failed to save file metadata: ${error.message}`
            });
          }

          // Update the designation record
          const { error: updateError } = await supabase
            .from('designation')
            .update({
              designation_data: designationData,
              localization_data: isLocalizationDifferent ? localizationData : existingDesignation.localization_data
            })
            .eq('file_id', existingFile.file_id);
            
          if (updateError) {
            console.error('Error updating designation:', updateError);
            return res.status(500).json({ 
              success: false, 
              error: `Failed to update existing designation: ${updateError.message}`
            });
          }

          console.log('Successfully updated designation with changes');
          res.status(200).json({ 
            success: true,
            message: 'Designation data saved successfully',
            fileId: existingFile.file_id,
            modifiedDate: modifiedDate
          });
        } else {
          console.log('No changes detected in designation data, skipping update');
          res.status(200).json({ 
            success: true,
            message: 'No changes detected in designation data',
            fileId: existingFile.file_id
          });
        }
      } else {
        // Insert new designation record
        console.log('Creating new designation record...');
        // Handle file record for new designation
        try {
          await handleFileRecord(fileId, fileName, creationDate, modifiedDate, req.headers.authorization, patientId);
        } catch (error) {
          console.error('Error saving file metadata:', error);
          return res.status(500).json({ 
            success: false, 
            error: `Failed to save file metadata: ${error.message}`
          });
        }

        const { error: insertError } = await supabase
          .from('designation')
          .insert({
            file_id: existingFile.file_id,
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
        res.status(200).json({ 
          success: true,
          message: 'Designation data saved successfully',
          fileId: existingFile.file_id,
          modifiedDate: modifiedDate
        });
      }
    } else {
      // Insert new designation record
      console.log('Creating new designation record...');
      // Handle file record for new designation
      try {
        await handleFileRecord(fileId, fileName, creationDate, modifiedDate, req.headers.authorization, patientId);
      } catch (error) {
        console.error('Error saving file metadata:', error);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to save file metadata: ${error.message}`
        });
      }

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
      res.status(200).json({ 
        success: true,
        message: 'Designation data saved successfully',
        fileId: fileId,
        modifiedDate: modifiedDate
      });
    }
  } catch (error) {
    console.error('Error in save-designation endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Endpoint to get designation by patient ID
router.get('/by-patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { type } = req.query;
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Missing patient ID' });
    }

    let filename;
    if (type === 'resection') {
      filename = '%neurosurgery%';
    }
    else {
      filename = '%epilepsy%';
    }

    // Get the file ID for this patient's designation
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('file_id')
      .eq('patient_id', patientId)
      .ilike('filename', filename)
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

    // Get the designation data
    const { data: designationData, error: designationError } = await supabase
      .from('designation')
      .select('*')
      .eq('file_id', fileData.file_id)
      .single();

    if (designationError && designationError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching designation:', designationError);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to fetch designation: ${designationError.message}`
      });
    }

    if (!designationData) {
      return res.status(200).json({ 
        success: true,
        exists: false
      });
    }

    res.status(200).json({ 
      success: true,
      exists: true,
      data: designationData,
      fileId: fileData.file_id
    });
  } catch (error) {
    console.error('Error in get-designation-by-patient endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

export default router;
