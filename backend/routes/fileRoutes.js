import express from 'express';
import cors from 'cors';
import { supabase, handleFileRecord } from './utils.js';

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
  
    const { fileId, fileName, creationDate, modifiedDate, patientId } = req.body;
  
    try {
      await handleFileRecord(fileId, fileName, creationDate, modifiedDate, token, patientId);
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

      // Check for resection data
      const { data: resectionData, error: resectionError } = await supabase
        .from('designation')
        .select('*')
        .eq('file_id', parsedFileId)
        .single();

      if (resectionError && resectionError.code !== 'PGRST116') {
        console.error('Error checking resection data:', resectionError);
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
        hasResection: !!resectionData,
        hasDesignation: !!designationData,
        hasTestSelection: !!testSelectionData,
        hasStimulation: !!stimulationData,
        resectionData: resectionData ? {
          resection_data: resectionData.designation_data,
          localization_data: resectionData.localization_data
        } : null,
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

// Get patient ID from file
router.get("/files/patient/:fileId", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    const { fileId } = req.params;
    if (!fileId) {
        return res.status(400).json({ error: "File ID is required" });
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

        const { data: file, error } = await supabase
            .from('files')
            .select('patient_id')
            .eq('file_id', fileId)
            .single();

        if (error) throw error;
        res.json({ patientId: file?.patient_id });
    } catch (error) {
        console.error('Error fetching patient ID:', error);
        res.status(500).json({ error: "Error fetching patient ID" });
    }
});

// Get all patients with their files
router.get("/patients/recent", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const { data: session } = await supabase
            .from('sessions')
            .select('user_id')
            .eq('token', token)
            .single();

        if (!session?.user_id) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        // First get all patient IDs that the user has access to through file assignments
        const { data: fileAssignments, error: assignmentError } = await supabase
            .from('file_assignments')
            .select('patient_id')
            .eq('user_id', session.user_id)
            .not('patient_id', 'is', null);

        if (assignmentError) throw assignmentError;

        // Extract unique patient IDs
        const patientIds = [...new Set(fileAssignments.map(assignment => assignment.patient_id))];

        if (patientIds.length === 0) {
            return res.json({
                patients: [],
                totalPatients: 0,
                currentPage: page,
                totalPages: 0
            });
        }

        // Get all files for these patients
        const { data: files, error } = await supabase
            .from('files')
            .select(`
                patient_id,
                file_id,
                filename,
                creation_date,
                modified_date,
                owner_user_id
            `)
            .in('patient_id', patientIds)
            .order('modified_date', { ascending: false });

        if (error) throw error;

        // Group files by patient and determine file types
        const patients = files.reduce((acc, curr) => {
            if (!acc[curr.patient_id]) {
                acc[curr.patient_id] = {
                    patient_id: curr.patient_id,
                    latest_file: curr,
                    has_localization: false,
                    has_resection: false,
                    has_designation: false,
                    has_test_selection: false,
                    localization_file_id: null,
                    resection_file_id: null,
                    designation_file_id: null,
                    test_selection_file_id: null,
                    localization_creation_date: null,
                    stimulation_types: {
                        mapping: null,
                        recreation: null,
                        ccep: null
                    }
                };
            }

            // Check file type based on filename
            const filename = curr.filename.toLowerCase();
            if (filename.includes('anatomy')) {
                acc[curr.patient_id].has_localization = true;
                acc[curr.patient_id].localization_file_id = curr.file_id;
                acc[curr.patient_id].localization_creation_date = curr.creation_date;
            } else if (filename.includes('epilepsy')) {
                acc[curr.patient_id].has_designation = true;
                acc[curr.patient_id].designation_file_id = curr.file_id;
            } else if (filename.includes('neurosurgery')) {
                acc[curr.patient_id].has_resection = true;
                acc[curr.patient_id].resection_file_id = curr.file_id;
            } else if (filename.includes('functional mapping')) {
                acc[curr.patient_id].stimulation_types.mapping = curr.file_id;
            } else if (filename.includes('seizure recreation')) {
                acc[curr.patient_id].stimulation_types.recreation = curr.file_id;
            } else if (filename.includes('cceps')) {
                acc[curr.patient_id].stimulation_types.ccep = curr.file_id;
            } else if (filename.includes('neuropsychology')) {
                acc[curr.patient_id].has_test_selection = true;
                acc[curr.patient_id].test_selection_file_id = curr.file_id;
            }

            return acc;
        }, {});

        // Convert to array and sort by most recent
        const allPatients = Object.values(patients)
            .sort((a, b) => new Date(b.latest_file.modified_date) - new Date(a.latest_file.modified_date));

        const count = allPatients.length;

        res.json({
            patients: allPatients.slice(offset, offset + limit),
            totalPatients: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: "Error fetching patients" });
    }
});

// Get file metadata (creation and modification dates)
router.get("/files/dates-metadata", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    const { fileId } = req.query;
    if (!fileId) {
        return res.status(400).json({ error: "File ID is required" });
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

        const { data: file, error } = await supabase
            .from('files')
            .select('creation_date, modified_date')
            .eq('file_id', fileId)
            .single();

        if (error) throw error;
        res.json(file || { creation_date: null, modified_date: null });
    } catch (error) {
        console.error('Error fetching file metadata:', error);
        res.status(500).json({ error: "Error fetching file metadata" });
    }
});

// Share file with neurosurgeon
router.post("/files/share-with-neurosurgeon", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    const { fileId, email, designationData, localizationData } = req.body;
    if (!fileId || !email) {
        return res.status(400).json({ error: "File ID and email are required" });
    }

    try {
        // Get the current user's session
        const { data: session } = await supabase
            .from('sessions')
            .select('user_id')
            .eq('token', token)
            .single();

        if (!session?.user_id) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        // Get the target user's ID from their email
        const { data: targetUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (userError || !targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get the original file's data
        const { data: originalFile, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('file_id', fileId)
            .single();

        if (fileError || !originalFile) {
            return res.status(404).json({ error: "File not found" });
        }

        // Create a new file for neurosurgery
        const { data: newFile, error: insertError } = await supabase
            .from('files')
            .insert({
                filename: 'Neurosurgery',
                owner_user_id: targetUser.id,
                patient_id: originalFile.patient_id,
                creation_date: new Date().toISOString(),
                modified_date: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Create file assignment for the new file
        const { error: assignmentError } = await supabase
            .from('file_assignments')
            .insert({
                file_id: newFile.file_id,
                user_id: targetUser.id,
                patient_id: originalFile.patient_id,
                role: 'owner',
                has_seen: false,
                is_completed: false,
                completed_at: null
            });

        if (assignmentError) throw assignmentError;

        // Create the designation record for the neurosurgery file
        if (designationData && localizationData) {
            const { error: designationError } = await supabase
                .from('designation')
                .insert({
                    file_id: newFile.file_id,
                    designation_data: designationData,
                    localization_data: localizationData
                });

            if (designationError) throw designationError;
        }

        res.json({ 
            success: true, 
            message: "File shared successfully",
            newFileId: newFile.file_id
        });
    } catch (error) {
        console.error('Error sharing file:', error);
        res.status(500).json({ error: "Error sharing file" });
    }
});

// Share file with epileptologist
router.post("/files/share-with-epileptologist", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    const { fileId, email, designationData, localizationData } = req.body;
    if (!fileId || !email) {
        return res.status(400).json({ error: "File ID and email are required" });
    }

    try {
        // Get the current user's session
        const { data: session } = await supabase
            .from('sessions')
            .select('user_id')
            .eq('token', token)
            .single();

        if (!session?.user_id) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        // Get the target user's ID from their email
        const { data: targetUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (userError || !targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get the original file's data
        const { data: originalFile, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('file_id', fileId)
            .single();

        if (fileError || !originalFile) {
            return res.status(404).json({ error: "File not found" });
        }

        // Create a new file for epilepsy
        const { data: newFile, error: insertError } = await supabase
            .from('files')
            .insert({
                filename: 'Epilepsy',
                owner_user_id: targetUser.id,
                patient_id: originalFile.patient_id,
                creation_date: new Date().toISOString(),
                modified_date: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Create file assignment for the new file
        const { error: assignmentError } = await supabase
            .from('file_assignments')
            .insert({
                file_id: newFile.file_id,
                user_id: targetUser.id,
                patient_id: originalFile.patient_id,
                role: 'owner',
                has_seen: false,
                is_completed: false,
                completed_at: null
            });

        if (assignmentError) throw assignmentError;

        // Create the designation record for the epilepsy file
        if (designationData && localizationData) {
            const { error: designationError } = await supabase
                .from('designation')
                .insert({
                    file_id: newFile.file_id,
                    designation_data: designationData,
                    localization_data: localizationData
                });

            if (designationError) throw designationError;
        }

        res.json({ 
            success: true, 
            message: "File shared successfully",
            newFileId: newFile.file_id
        });
    } catch (error) {
        console.error('Error sharing file:', error);
        res.status(500).json({ error: "Error sharing file" });
    }
});

// Share file with neuropsychologist
router.post('/files/share-with-neuropsychologist', async (req, res) => {
    const { fileId, email, testSelectionData } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    if (!fileId || !email) {
        return res.status(400).json({ error: 'File ID and email are required' });
    }

    try {
        // Get current user's session
        const { data: session } = await supabase
            .from('sessions')
            .select('user_id')
            .eq('token', token)
            .single();
        if (!session?.user_id) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        // Get target user's ID
        const { data: targetUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (userError || !targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get the original file's data
        const { data: originalFile, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('file_id', fileId)
            .single();
        if (fileError || !originalFile) {
            return res.status(404).json({ error: 'Original file not found' });
        }

        // Create a new file for neuropsychology
        const { data: newFile, error: insertError } = await supabase
            .from('files')
            .insert({
                filename: 'Neuropsychology',
                owner_user_id: targetUser.id,
                patient_id: originalFile.patient_id,
                creation_date: new Date().toISOString(),
                modified_date: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Create file assignment
        const { error: assignmentError } = await supabase
            .from('file_assignments')
            .insert({
                file_id: newFile.file_id,
                user_id: targetUser.id,
                patient_id: originalFile.patient_id,
                role: 'owner',
                has_seen: false,
                is_completed: false,
                completed_at: null
            });

        if (assignmentError) throw assignmentError;

        // Create the test selection record for the neuropsychology file
        if (testSelectionData) {
            const { error: testSelectionError } = await supabase
                .from('test_selection')
                .insert({
                    file_id: newFile.file_id,
                    tests: testSelectionData.tests,
                    contacts: testSelectionData.contacts
                });

            if (testSelectionError) throw testSelectionError;
        }

        res.json({ 
            success: true, 
            message: "File shared successfully",
            newFileId: newFile.file_id
        });
    } catch (error) {
        console.error('Error sharing file with neuropsychologist:', error);
        res.status(500).json({ error: 'Failed to share file with neuropsychologist' });
    }
});

export default router;
