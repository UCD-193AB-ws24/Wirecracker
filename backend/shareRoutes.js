import express from 'express';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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

// Create share record and send notification
router.post('/create-share', async (req, res) => {
    try {
        const { email, fileId, permissionLevel } = req.body;
        const token = req.headers.authorization;

        if (!email || !fileId || !permissionLevel || !token) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        // Get user IDs
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

        if (!sessionData || !targetUser) {
            return res.status(400).json({ 
                error: 'Invalid user or session' 
            });
        }

        // Create share record
        const { data: shareData, error: shareError } = await supabase
            .from('fileshares')
            .insert({
                file_id: fileId,
                shared_with_user_id: targetUser.id,
                permission_level: permissionLevel,
                shared_date: new Date().toISOString()
            })
            .select()
            .single();

        if (shareError) {
            console.error('Share error:', shareError);
            return res.status(500).json({ 
                error: 'Failed to create share record' 
            });
        }

        // Send email notification
        const response = await resend.emails.send({
            from: 'send@wirecracker.com',
            to: email,
            subject: 'A File Has Been Shared With You',
            html: `<p>A file has been shared with you on Wirecracker.</p>`,
        });

        res.status(200).json({ 
            message: 'Share created successfully',
            share: shareData
        });
    } catch (error) {
        console.error('Error creating share:', error);
        res.status(500).json({ 
            error: 'Failed to create share' 
        });
    }
});

// Export with __esModule flag
export default router;
console.log('Share routes exported'); 