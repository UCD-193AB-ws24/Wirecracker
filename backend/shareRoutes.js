import express from 'express';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import config from "../config.json" assert { type: 'json' };

dotenv.config();
const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Add debug logging to check config values
console.log('Config loaded:', config);

// Use fallback if config.frontendURL is undefined
const frontendURL = config.frontendURL || 'http://localhost:3000';

// Log the final URL being used
console.log('Frontend URL for share links:', frontendURL);

// Debug logging
console.log('Initializing share routes...');

// Add debug middleware to log all requests
router.use((req, res, next) => {
    console.log('Share route hit:', {
        path: req.path,
        method: req.method,
        body: req.body,
        headers: req.headers
    });
    next();
});

// Test GET route
router.get('/test', (req, res) => {
    console.log('GET /test route hit');
    res.json({ message: 'Share routes working' });
});

// Validate email and check for existing share
router.post('/validate-email', async (req, res) => {
    try {
        const { email, fileId } = req.body;
        
        if (!email || !fileId) {
            return res.status(400).json({ 
                valid: false,
                error: 'Email and fileId are required'
            });
        }

        // Get user ID for the email
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
            
        if (userError || !userData) {
            return res.status(400).json({ 
                valid: false,
                error: 'User not found'
            });
        }

        // Check for existing share
        const { data: existingShare, error: shareError } = await supabase
            .from('fileshares')
            .select('*')
            .eq('file_id', fileId)
            .eq('shared_with_user_id', userData.id)
            .single();

        if (existingShare) {
            return res.status(400).json({
                valid: false,
                error: 'File already shared with this user'
            });
        }

        res.json({ 
            valid: true,
            userId: userData.id
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            valid: false,
            error: error.message 
        });
    }
});

// Add this function to get current localization data
const getLocalizationSnapshot = async (fileId) => {
    const { data, error } = await supabase
        .from('localization')
        .select(`
            id, contact, tissue_type,
            electrode:electrode_id(id, label, description, contact_number),
            region:region_id(id, name)
        `)
        .eq('file_id', fileId);

    if (error) throw error;
    return data;
};

// Modify the create-share endpoint
router.post('/create-share', async (req, res) => {
    try {
        const { email, fileId, permissionLevel } = req.body;
        const token = req.headers.authorization;

        if (!email || !fileId || !permissionLevel || !token) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        // Get user IDs and file info
        const { data: sessionData } = await supabase
            .from('sessions')
            .select('user_id')
            .eq('token', token)
            .single();

        const { data: targetUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        const { data: fileData } = await supabase
            .from('files')
            .select('filename')
            .eq('file_id', fileId)
            .single();

        if (!sessionData || !targetUser || !fileData) {
            return res.status(400).json({ 
                error: 'Invalid user, session, or file' 
            });
        }

        // Get current localization data
        const localizationData = await getLocalizationSnapshot(fileId);
        
        // Transform the data into the electrode format
        const electrodes = {};
        localizationData.forEach(record => {
            const label = record.electrode.label;
            const description = record.electrode.description;
            const contact = record.contact;
            const regionName = record.region?.name || '';
            const tissueType = record.tissue_type;

            if (!electrodes[label]) {
                electrodes[label] = {
                    description: description
                };
            }

            if (!electrodes[label][contact]) {
                electrodes[label][contact] = {
                    associatedLocation: tissueType,
                    contactDescription: regionName
                };
            } else if (tissueType === 'GM' && electrodes[label][contact].associatedLocation === 'GM') {
                const existingDesc = electrodes[label][contact].contactDescription;
                electrodes[label][contact].associatedLocation = 'GM/GM';
                electrodes[label][contact].contactDescription = `${existingDesc}+${regionName}`;
            }
        });

        // Create share record with snapshot
        const { data: shareData, error: shareError } = await supabase
            .from('fileshares')
            .insert({
                file_id: fileId,
                shared_with_user_id: targetUser.id,
                permission_level: permissionLevel,
                shared_date: new Date().toISOString(),
                current_snapshot: electrodes,
                changed_data: null
            })
            .select()
            .single();

        if (shareError) throw shareError;

        // Generate a file access URL using frontendURL from config
        const fileUrl = `${frontendURL}/shared/${fileId}`;

        // Send email notification with link
        const response = await resend.emails.send({
            from: 'send@wirecracker.com',
            to: email,
            subject: `${fileData.filename} has been shared with you`,
            html: `
                <h2>A file has been shared with you on Wirecracker</h2>
                <p><strong>${fileData.filename}</strong> has been shared with you.</p>
                <p>Click the link below to view the file:</p>
                <a href="${fileUrl}" style="
                    display: inline-block;
                    background-color: #0369a1;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                ">View File</a>
                <p>If you're not already signed in, you'll be prompted to do so first.</p>
            `,
        });

        res.status(200).json({ 
            message: 'Share created successfully',
            share: shareData
        });
    } catch (error) {
        console.error('Error creating share:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export with __esModule flag
export default router;
console.log('Share routes exported'); 