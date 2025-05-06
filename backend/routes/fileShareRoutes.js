import express from 'express';
import cors from 'cors';
import { supabase } from './utils.js';

const router = express.Router();
router.use(cors());
router.use(express.json());

// Get file logs including approvals and suggested changes
router.get('/logs/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        // Get approvals
        const { data: approvals } = await supabase
            .from('approved_files')
            .select(`
                approved_date,
                approved_by:approved_by_user_id(name)
            `)
            .eq('file_id', fileId);

        // Get suggested changes
        const { data: suggestions } = await supabase
            .from('fileshares')
            .select(`
                shared_date,
                changed_data,
                current_snapshot,
                shared_with:shared_with_user_id(name),
                status
            `)
            .eq('file_id', fileId)
            .eq('status', 'changes_suggested');

        const allLogs = [
            ...(approvals?.map(a => ({
                type: 'approval',
                date: a.approved_date,
                user: a.approved_by?.name,
                message: `File approved by: ${a.approved_by?.name}`
            })) || []),
            ...(suggestions?.map(s => ({
                type: 'changes',
                date: s.shared_date,
                user: s.shared_with?.name,
                message: `Changes suggested by: ${s.shared_with?.name}`,
                changes: s.changed_data,
                snapshot: s.current_snapshot
            })) || [])
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(allLogs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Approve a file
router.post('/approve/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        // Get user ID from session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('user_id')
            .eq('token', token)
            .single();

        if (sessionError || !session) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        // Remove from fileshares
        const { error: deleteError } = await supabase
            .from('fileshares')
            .delete()
            .eq('file_id', fileId)
            .eq('shared_with_user_id', session.user_id);

        if (deleteError) {
            throw deleteError;
        }

        // Add to approved_files
        const { error: approvedError } = await supabase
            .from('approved_files')
            .insert({
                file_id: fileId,
                approved_by_user_id: session.user_id,
                approved_date: new Date().toISOString()
            });

        if (approvedError) {
            throw approvedError;
        }

        res.json({ message: 'File approved successfully' });
    } catch (error) {
        console.error('Error approving file:', error);
        res.status(500).json({ error: 'Failed to approve file' });
    }
});

// Submit changes to a file
router.post('/submit-changes/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const { changes } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        // Get user ID from session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('user_id')
            .eq('token', token)
            .single();

        if (sessionError || !session) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        // Update fileshares with changes and status
        const { error: updateError } = await supabase
            .from('fileshares')
            .update({
                changed_data: changes,
                status: 'changes_suggested'
            })
            .eq('file_id', fileId)
            .eq('shared_with_user_id', session.user_id);

        if (updateError) {
            throw updateError;
        }

        res.json({ message: 'Changes submitted successfully' });
    } catch (error) {
        console.error('Error submitting changes:', error);
        res.status(500).json({ error: 'Failed to submit changes' });
    }
});

export default router; 
