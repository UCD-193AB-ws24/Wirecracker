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

// Validate email route with explicit path
router.post('/validate-email', (req, res) => {
    console.log('POST /validate-email route hit');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                valid: false,
                error: 'Email is required'
            });
        }

        // For testing, just return success
        res.json({ valid: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            valid: false,
            error: error.message 
        });
    }
});

// Send share notification email
router.post('/send-share-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const response = await resend.emails.send({
            from: 'send@wirecracker.com',
            to: email,
            subject: 'File Shared with You',
            html: '<p>A file has been shared with you</p>',
        });

        res.status(200).json({ message: 'Share notification email sent' });
    } catch (error) {
        console.error('Error sending share notification:', error);
        res.status(500).json({ error: 'Failed to send share notification' });
    }
});

// Export with __esModule flag
export default router;
console.log('Share routes exported'); 