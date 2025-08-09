// server/routes/userRoutes.js

const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); // Import middlewares
const User = require('../models/userModel'); // We'll just fetch current user for now

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile (requires authentication)
// @access  Private
router.get('/profile', protect, async (req, res) => {
    // req.user is available here because of the 'protect' middleware
    res.json({
        message: 'User profile fetched successfully',
        user: req.user, // The user object attached by the protect middleware
    });
});

// @route   GET /api/users/admin-only
// @desc    Admin-only access (requires authentication and 'admin' role)
// @access  Private/Admin
router.get('/admin-only', protect, authorizeRoles('admin'), (req, res) => {
    res.json({
        message: `Welcome, ${req.user.username}! This is an Admin-only area.`,
        user: req.user,
    });
});

// @route   GET /api/users/manager-or-admin
// @desc    Manager or Admin access
// @access  Private/Manager, Admin
router.get('/manager-or-admin', protect, authorizeRoles('manager', 'admin'), (req, res) => {
    res.json({
        message: `Welcome, ${req.user.username}! This area is for Managers or Admins.`,
        user: req.user,
    });
});


module.exports = router;