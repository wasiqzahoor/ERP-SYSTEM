// server/controllers/authController.js

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/emailService');
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
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


// @route   POST /api/auth/login
// @access  Public
exports.authUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // <--- IMPORTANT: Check if account is active before allowing login
        if (user.status !== 'active') {
            return res.status(403).json({ message: `Account is ${user.status}. Please contact an administrator for activation.` });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken(user._id, user.role);

        res.json({
            message: 'Logged in successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status, // Status bhi login response mein bhejenge
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

exports.sendVerificationCode = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide all fields.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user && user.status !== 'unverified') {
            return res.status(400).json({ message: 'Email is already registered and verified.' });
        }
        
        // If user exists but is unverified, update them. Otherwise, create new.
        if (!user) {
            user = new User({ username, email, password });
        } else {
            user.username = username;
            user.password = password; // This will trigger pre-save hook to re-hash
        }

        const verificationCode = user.getVerificationCode();
        await user.save();
        
        // Send email
        await sendVerificationEmail(user.email, verificationCode);

        res.status(200).json({ message: `A verification code has been sent to ${user.email}.` });

    } catch (error) {
        console.error('Error sending verification:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.verifyAndRegister = async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await User.findOne({ 
            email,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() }, // Check if not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid verification code or code has expired.' });
        }

        user.status = 'pending'; // <-- Set status to pending
        user.verificationCode = undefined; // Clear the code
        user.verificationCodeExpires = undefined; // Clear expiry
        await user.save();

        res.status(201).json({
            message: 'Email verified successfully. Your account is now pending approval by an admin.',
            user: { id: user._id, username: user.username, email: user.email },
        });

    } catch (error) {
        console.error('Error verifying code:', error);
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