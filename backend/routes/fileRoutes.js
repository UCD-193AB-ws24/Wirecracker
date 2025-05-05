import express from 'express';
import cors from 'cors';
import { supabase } from './utils.js';

const router = express.Router();
router.use(cors());
router.use(express.json());

// File Operations Endpoints
router.get("/files", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No authentication token provided" });
    }
  
    try {
      const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('token', token)
        .single();
  
      if (!session?.user_id) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }
  
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('owner_user_id', session.user_id)
        .order('modified_date', { ascending: false });
  
      if (error) throw error;
      res.json(files || []);
    } catch (error) {
      console.error('Error fetching user files:', error);
      res.status(500).json({ error: "Error fetching user files" });
    }
});
  
router.post("/files/metadata", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No authentication token provided" });
    }
  
    const { fileId, fileName, creationDate, modifiedDate } = req.body;
  
    try {
      const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('token', token)
        .single();
  
      if (!session?.user_id) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }
  
      const { data: existingFile } = await supabase
        .from('files')
        .select('*')
        .eq('file_id', fileId)
        .single();
  
      if (existingFile) {
        const { error } = await supabase
          .from('files')
          .update({
            filename: fileName,
            modified_date: modifiedDate
          })
          .eq('file_id', fileId);
  
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('files')
          .insert({
            file_id: fileId,
            owner_user_id: session.user_id,
            filename: fileName,
            creation_date: creationDate,
            modified_date: modifiedDate
          });
  
        if (error) throw error;
      }
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving file metadata:', error);
      res.status(500).json({ error: "Error saving file metadata" });
    }
});

// File Type Checking Endpoint
router.get("/files/check-type", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No authentication token provided" });
    }
  
    const { fileId } = req.query;
    if (!fileId) {
      return res.status(400).json({ error: "File ID is required" });
    }
  
    // Parse fileId as integer to ensure it's a valid number
    const parsedFileId = parseInt(fileId, 10);
    if (isNaN(parsedFileId)) {
      return res.status(400).json({ error: "Invalid file ID format" });
    }
  
    try {
      // Check for localization data
      const { data: localizationData, error: localizationError } = await supabase
        .from('localization')
        .select('id')
        .eq('file_id', parsedFileId)
        .limit(1);
  
      if (localizationError) {
        console.error('Error checking localization data:', localizationError);
      }
  
      // Check for designation data
      const { data: designationData, error: designationError } = await supabase
        .from('designation')
        .select('*')
        .eq('file_id', parsedFileId)
        .single();
  
      if (designationError && designationError.code !== 'PGRST116') {
        console.error('Error checking designation data:', designationError);
      }
  
      // Check for test selection data
      const { data: testSelectionData, error: testSelectionError } = await supabase
        .from('test_selection')
        .select('*')
        .eq('file_id', parsedFileId)
        .single();
  
      if (testSelectionError && testSelectionError.code !== 'PGRST116') {
        console.error('Error checking test selection data:', testSelectionError);
      }
  
      // Check for stimulation data
      const { data: stimulationData, error: stimulationError } = await supabase
        .from('stimulation')
        .select('*')
        .eq('file_id', parsedFileId)
        .single();
  
      if (stimulationError && stimulationError.code !== 'PGRST116') {
        console.error('Error checking stimulation data:', stimulationError);
      }
  
      res.json({
        hasLocalization: localizationData && localizationData.length > 0,
        hasDesignation: !!designationData,
        hasTestSelection: !!testSelectionData,
        hasStimulation: !!stimulationData,
        designationData: designationData ? {
          designation_data: designationData.designation_data,
          localization_data: designationData.localization_data
        } : null,
        testSelectionData: testSelectionData ? {
          tests: testSelectionData.tests,
          contacts: testSelectionData.contacts
        } : null,
        stimulationData: stimulationData ? {
          stimulation_data: stimulationData.stimulation_data,
          plan_order: stimulationData.plan_order,
          is_mapping: stimulationData.is_mapping
        } : null
      });
    } catch (error) {
      console.error('Error in check-type endpoint:', error);
      res.status(500).json({ error: "Error checking file type" });
    }
});
  
// Localization Data Retrieval Endpoint
router.get("/files/localization", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No authentication token provided" });
    }
  
    const { fileId } = req.query;
    if (!fileId) {
      return res.status(400).json({ error: "File ID is required" });
    }
  
    // Parse fileId as integer to ensure it's a valid number
    const parsedFileId = parseInt(fileId, 10);
    if (isNaN(parsedFileId)) {
      return res.status(400).json({ error: "Invalid file ID format" });
    }
  
    try {
      const { data: localizationData, error } = await supabase
        .from('localization')
        .select(`
          id, contact, tissue_type, file_id,
          electrode:electrode_id(id, label, description, contact_number, type),
          region:region_id(id, name)
        `)
        .eq('file_id', parsedFileId);
  
      if (error) {
        console.error('Error fetching localization data:', error);
        return res.status(500).json({ error: "Error fetching localization data" });
      }
  
      res.json(localizationData || []);
    } catch (error) {
      console.error('Error in localization endpoint:', error);
      res.status(500).json({ error: "Error fetching localization data" });
    }
});

export default router;
