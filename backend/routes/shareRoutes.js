import express from 'express';
import cors from 'cors';
import { supabase } from './utils.js';
import { Resend } from 'resend';

const router = express.Router();
router.use(cors());
router.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /share - Share a file with another user and send confirmation email
router.post('/share', async (req, res) => {
    try {
        const { patientId, email, fileId } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, error: 'No authentication token provided' });
        }
        if (!patientId || !email || !fileId) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
/*
        // Get the current user's email
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError) {
            throw new Error('Failed to get user information');
        } */

        // Check if the target user exists
        const { data: targetUser, error: targetError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', email)
            .single();

        if (targetError || !targetUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

   /*     // Create a share record
        const { error: shareError } = await supabase
            .from('fileshares')
            .insert({
                file_id: fileId,
                patient_id: patientId,
                shared_by: user.id,
                shared_with: targetUser.id,
                status: 'pending'
            }); 

        if (shareError) {
            throw new Error('Failed to create share record');
        } */

        // Send confirmation email using Resend
        await resend.emails.send({
            from: 'send@wirecracker.com',
            to: email,
            subject: 'A file has been shared with you on Wirecracker',
            html: `
                <h2>File Shared</h2>
                <p>A file has been shared with you by someone on Wirecracker.</p>
                <p>Please log in to your account to view the shared file.</p>
            `
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error in share endpoint:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router; 