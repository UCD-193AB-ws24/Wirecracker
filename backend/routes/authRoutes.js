import express from 'express';
import cors from 'cors';
import { supabase } from './utils.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
router.use(cors());
router.use(express.json());

// Authentication Endpoints
router.post("/auth/login", async (req, res) => {
    const { email, password, rememberMe } = req.body;
  
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
  
      if (error || !user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + (rememberMe ? 14 : 1) * 24 * 60 * 60 * 1000);
  
      await supabase.from('sessions').insert([{ user_id: user.id, token, expires_at: expiresAt }]);
  
      res.json({ 
        token, 
        expiresIn: rememberMe ? '14d' : '24h',
        user: { name: user.name, email: user.email }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Error during login" });
    }
});
  
router.post("/auth/verify-email", async (req, res) => {
const { email, code } = req.body;

try {
    const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

    if (error || !user) {
    return res.status(404).json({ error: "User not found" });
    }

    const { data: verificationRecord } = await supabase
    .from('email_verification_codes')
    .select('*')
    .eq('user_id', user.id)
    .eq('code', code)
    .single();

    if (!verificationRecord) {
    return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    await supabase.from('email_verification_codes').delete().eq('user_id', user.id);

    res.json({ message: 'Email verified. You can now log in.' });
} catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: "Error during email verification" });
}
});

// Signup Endpoint
router.post("/auth/signup", async (req, res) => {
    const { email, name, password } = req.body;

    try {
        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

        if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError);
        return res.status(500).json({ error: "Error during signup" });
        }

        if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const { data: user, error: insertError } = await supabase
        .from('users')
        .insert([{ email, name, password_hash: hashedPassword }])
        .select();

        if (insertError) {
        console.error('Error creating user:', insertError);
        return res.status(500).json({ error: "Error creating user account" });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store verification code
        const { error: codeError } = await supabase
        .from('email_verification_codes')
        .insert([
            { 
            user_id: user[0].id, 
            code: verificationCode, 
            expires_at: new Date(Date.now() + 15 * 60 * 1000) 
            }
        ]);

        if (codeError) {
        console.error('Error storing verification code:', codeError);
        return res.status(500).json({ error: "Error during signup process" });
        }

        res.json({ 
        success: true, 
        message: "User created successfully", 
        verificationCode 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: "Error during signup process" });
    }
});

export default router;
