// server/controllers/authController.js

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
};

// @desc    Register new user (ONLY for employees, default status: pending, no token returned)
// @route   POST /api/auth/register
// @access  Public
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

// @desc    Authenticate user & get token (only if status is active)
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