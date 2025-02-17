import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export async function sendVerificationEmail(email, code) {
    try {
        const response = await resend.emails.send({
            from: 'noreply@yourapp.com', // Set up a verified sender domain in Resend
            to: email,
            subject: 'Your Verification Code',
            html: `<p>Your verification code is: <strong>${code}</strong></p>`,
        });

        console.log('Email sent:', response);
        return response;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send verification email');
    }
}
