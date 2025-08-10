// server/config/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465||587,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendVerificationEmail = async (to, code) => {
    try {
        await transporter.sendMail({
            from: `"Your ERP App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Your Email Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                    <h2>Email Verification</h2>
                    <p>Thank you for registering. Please use the following code to verify your email address:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f2f2f2; padding: 10px; border-radius: 5px;">
                        ${code}
                    </p>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            `,
        });
        console.log('Verification email sent to:', to);
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};

const sendPasswordResetEmail = async (to, code) => {
    try {
        await transporter.sendMail({
            from: `"Your ERP App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Your Password Reset Code',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset your password. Use the following code to reset it:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f2f2f2; padding: 10px; border-radius: 5px;">
                        ${code}
                    </p>
                    <p>This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
                </div>
            `,
        });
        console.log('Password reset email sent to:', to);
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };