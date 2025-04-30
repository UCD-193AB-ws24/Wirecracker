import express from 'express';
import cors from 'cors';
import { supabase } from './utils.js';

const router = express.Router();
router.use(cors());
router.use(express.json());

// User Profile Endpoints
router.get("/user/profile", async (req, res) => {
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
  
      const { data: user, error } = await supabase
        .from('users')
        .select('name')
        .eq('id', session.user_id)
        .single();
  
      if (error) throw error;
      res.json(user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: "Error fetching user profile" });
    }
});

export default router;
