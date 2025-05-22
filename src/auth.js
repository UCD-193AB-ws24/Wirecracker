//import { sendVerificationEmail } from './utils/emailService';

const backendURL = __APP_CONFIG__.backendURL;

export async function sendVerificationEmail(email, code) {
    try {
        const response = await fetch(`${backendURL}/send-verification-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
        });

        if (!response.ok) {
            throw new Error('Failed to send verification email');
        }

        console.log('Verification email sent successfully');
    } catch (error) {
        console.error('Error:', error);
        throw new Error('Failed to send email');
    }
}

export async function signUp(email, name, password) {
    try {
        const response = await fetch(`${backendURL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Signup failed');
        }

        const result = await response.json();
        
        // Send verification email
        await sendVerificationEmail(email, result.verificationCode);
        console.log('Verification code:', result.verificationCode); // Replace with email service

        return { message: 'Verification email sent' };
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

export async function verifyEmail(email, code) {
    const response = await fetch(`${backendURL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Email verification failed');
    }

    return response.json();
}

export async function login(email, password, rememberMe) {
    const response = await fetch(`${backendURL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }

    return response.json();
}

