import express from 'express';
import cors from 'cors';
import { supabase, handleFileRecord } from './utils.js';

const router = express.Router();
router.use(cors());
router.use(express.json());

// Endpoint to get stimulation data by patient ID
router.get('/by-patient-stimulation/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { type } = req.query;
        
        if (!patientId) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing patient ID' 
            });
        }

        // First get the file ID for this patient
        const { data: fileData, error: fileError } = await supabase
            .from('files')
            .select('file_id, modified_date')
            .eq('patient_id', patientId)
            .eq('filename', type)
            .order('creation_date', { ascending: false })
            .limit(1);

        if (fileError) {
            console.error('Error fetching file:', fileError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch file data' 
            });
        }

        if (!fileData || fileData.length === 0) {
            return res.json({ 
                success: true,
                exists: false 
            });
        }

        const fileId = fileData[0].file_id;

        // Then get the stimulation data for this file
        const { data: stimulationData, error: stimulationError } = await supabase
            .from('stimulation')
            .select('*')
            .eq('file_id', fileId);

        if (stimulationError) {
            console.error('Error fetching stimulation data:', stimulationError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch stimulation data' 
            });
        }

        if (!stimulationData || stimulationData.length === 0) {
            return res.json({ 
                success: true,
                exists: false 
            });
        }

        res.json({
            success: true,
            exists: true,
            fileId: fileId,
            data: {
                stimulation_data: stimulationData[0].stimulation_data,
                plan_order: stimulationData[0].plan_order,
                type: stimulationData[0].type,
                modified_date: fileData[0].modified_date
            }
        });
    } catch (error) {
        console.error('Error in by-patient-stimulation endpoint:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint to save stimulation data
router.post('/save-stimulation', async (req, res) => {
    try {
        console.log('Received stimulation save request', req.body);
        
        const { electrodes, planOrder, type, fileId, fileName, creationDate, modifiedDate, patientId } = req.body;
        
        if (!electrodes) {
            return res.status(400).json({ success: false, error: 'Missing electrodes data' });
        }
        
        if (!planOrder) {
            return res.status(400).json({ success: false, error: 'Missing plan order data' });
        }
        
        if (fileId === undefined || fileId === null) {
            return res.status(400).json({ success: false, error: 'Missing file ID' });
        }
        
        if (!type || !['mapping', 'recreation', 'ccep'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Invalid or missing stimulation type' });
        }

        if (!patientId) {
            return res.status(400).json({ success: false, error: 'Missing patient ID' });
        }
        
        console.log(`Processing stimulation save request for file ID: ${fileId}`);

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
        
        // Check for existing stimulation with this file_id
        const { data: existingData, error: checkError } = await supabase
            .from('stimulation')
            .select('*')
            .eq('file_id', fileId);
            
        if (checkError) {
            console.error('Error checking existing stimulation:', checkError);
            return res.status(500).json({ 
                success: false, 
                error: `Failed to check existing stimulation: ${checkError.message}`
            });
        }

        if (existingData && existingData.length > 0) {
            // Compare the current data with existing data
            const existingStimulationData = existingData[0].stimulation_data;
            const hasDataChanged = JSON.stringify(electrodes) !== JSON.stringify(existingStimulationData);

            if (hasDataChanged) {
                console.log(`Found existing stimulation with file_id ${fileId}, updating...`);
                const { error: updateError } = await supabase
                    .from('stimulation')
                    .update({
                        stimulation_data: electrodes,
                        plan_order: planOrder,
                        type: type,
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
                console.log('No changes detected in stimulation data');
            }
        } else {
            // Insert new stimulation record
            console.log('Creating new stimulation record...');
            const { error: insertError } = await supabase
                .from('stimulation')
                .insert({
                    file_id: fileId,
                    stimulation_data: electrodes,
                    plan_order: planOrder,
                    type: type
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