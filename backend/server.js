import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Resend } from 'resend';
import apiRoutes from './apiRoutes.js';
import oauthRoutes from './oauth.js';
import shareRoutes from './shareRoutes.js';
import config from "../config.json" assert { type: 'json' };

dotenv.config();

const app = express();
const PORT = config.PORT || 5000;

const frontendURL = config.frontendURL;
const backendURL = config.backendURL;

// Debug logging
console.log('Initializing server...');

// 1. CORS middleware
app.use(cors({
    origin: frontendURL,
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));

// Add debug logging for middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
        headers: req.headers,
        body: req.body
    });
    next();
});

// 2. Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route in main app
app.get('/test', (req, res) => {
    res.json({ message: 'Main app working' });
});

// 3. Routes
app.use('/share', shareRoutes);
app.use('/', oauthRoutes);
app.use('/api', apiRoutes);

// Catch-all route for debugging
app.use('*', (req, res) => {
    console.log('404 route hit:', req.originalUrl);
    res.status(404).json({ 
        error: 'Not found',
        path: req.originalUrl,
        method: req.method
    });
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Email verification endpoint
app.post('/send-verification-email', async (req, res) => {
    const { email, code } = req.body;

    try {
        const response = await resend.emails.send({
            from: 'send@wirecracker.com',
            to: email,
            subject: 'Your Verification Code',
            html: `<p>Your verification code is: <strong>${code}</strong></p>`,
        });

        console.log('Email sent:', response);
        res.status(200).json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send verification email' });
    }
});

// Error handling middleware should come last
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on ${backendURL}`);
    console.log('Available routes:');
    console.log('- GET /test');
    console.log('- POST /share/validate-email');
    console.log('- GET /share/test');
});
