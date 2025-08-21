// server/controllers/authController.js

const User = require('../models/userModel');
const Tenant = require('../models/tenantModel');
const Notification = require('../models/notificationModel');
const Role = require('../models/roleModel');
const speakeasy = require('speakeasy'); // Assume speakeasy is installed and imported
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const {  sendPasswordResetEmail } = require('../config/emailService');
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

exports.registerUser = async (req, res) => {
    // Public registration ke liye, sirf username, email, password expect karenge
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all required fields: username, email, password.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        user = new User({
            username,
            email,
            password,
            role: 'employee',   // <--- IMPORTANT: Public registration always defaults to 'employee'
            status: 'pending',  // <--- IMPORTANT: All new public registrations are 'pending'
        });

        await user.save();

        res.status(201).json({
            message: 'Registration successful. Your account is pending approval by a manager or admin.',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
            },
            // No token returned here, as user is not yet active
        });

    } catch (error) {
        console.error('Registration error:', error.message);
        if (error.code === 11000) { // MongoDB duplicate key error for unique fields
            return res.status(400).json({ message: 'Email or username already in use.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

exports.authUser = async (req, res) => {
    const { email, password, twoFactorToken } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Check if account is active before allowing login
        if (user.status !== 'active') {
            return res.status(403).json({ message: `Account is ${user.status}. Please contact an administrator for activation.` });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // --- 2FA Logic Integration ---
        // If 2FA is enabled for the user
        if (user.twoFactorEnabled) {
            // Check if a 2FA token was provided in the request
            if (!twoFactorToken) {
                // If no token is provided, tell the client it's required
                return res.status(200).json({ twoFactorRequired: true });
            }

            // Verify the provided 2FA token
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorToken,
            });

            if (!verified) {
                return res.status(401).json({ message: 'Invalid 2FA token' });
            }
        }
        // --- End of 2FA Logic ---

        // If password is correct and 2FA (if enabled) is verified, generate and send the token
        const token = generateToken(user._id, user.role);

        res.json({
            message: 'Logged in successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
            },
            token,
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

exports.getUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('status username');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ status: user.status, username: user.username });
    } catch (error) {
        console.error('Error fetching user status:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        // Security: Hamesha success message bhejein taake koi guess na kar sakay ke email exist karta hai ya nahi.
        if (!user) {
            return res.status(200).json({ message: 'If a user with that email exists, a password reset code has been sent.' });
        }

        const resetCode = user.getVerificationCode(); // Re-using the same method!
        await user.save();
        
        // Send email with the reset code
        await sendPasswordResetEmail(user.email, resetCode);

        res.status(200).json({ message: 'If a user with that email exists, a password reset code has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, code, password } = req.body;
    try {
        const user = await User.findOne({
            email,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid code or code has expired.' });
        }

        user.password = password; // pre('save') hook in model will hash it
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully. Please log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.generateTwoFactorSecret = async (req, res) => {
    const secret = speakeasy.generateSecret({ length: 20, name: 'Your ERP App' });
    // User model mein secret.base32 save karein
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
        res.json({ qrCodeUrl: data_url });
    });
};

exports.verifyTwoFactorToken = async (req, res) => {
    const { token } = req.body;
    const verified = speakeasy.totp.verify({
        secret: req.user.twoFactorSecret,
        encoding: 'base32',
        token,
    });
    if (verified) {
        req.user.twoFactorEnabled = true;
        await req.user.save();
        res.status(200).json({ message: '2FA enabled successfully.' });
    } else {
        res.status(400).json({ message: 'Invalid 2FA token.' });
    }
};