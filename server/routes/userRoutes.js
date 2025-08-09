// server/routes/userRoutes.js

const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
    getAllUsers,
    getUserById,
    updateUserStatus,
    createStaffUser, // New staff creation endpoint
    updateUserRole,   // New role update endpoint
} = require('../controllers/userController');

const router = express.Router();

// --- Public/Current User Profile Routes ---
router.get('/profile', protect, (req, res) => {
    // Ye route ab bhi user ka apna profile dikhayega, regardless of role/status
    // Lekin 'protect' middleware ensure karega ki user logged-in aur token valid ho
    res.json({
        message: 'Your profile fetched successfully',
        user: req.user,
    });
});

// --- Admin & Manager Specific User Management Routes ---

// @route   POST /api/users/staff
// @desc    Create new staff user (Admin/Manager) - Admin only
// @access  Private (Admin)
router.post('/staff', protect, authorizeRoles('admin'), createStaffUser);

// @route   GET /api/users
// @desc    Get all users (Admin can see all, Manager can see employees/managers)
// @access  Private (Admin, Manager)
router.get('/', protect, authorizeRoles('admin', 'manager'), getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin, Manager can view employees/managers)
// @access  Private (Admin, Manager)
router.get('/:id', protect, authorizeRoles('admin', 'manager'), getUserById);

// @route   PUT /api/users/:id/status
// @desc    Update a user's status (Admin can update all; Manager can update employees)
// @access  Private (Admin, Manager)
router.put('/:id/status', protect, authorizeRoles('admin', 'manager'), updateUserStatus);

// @route   PUT /api/users/:id/role
// @desc    Update a user's role (Admin only)
// @access  Private (Admin)
router.put('/:id/role', protect, authorizeRoles('admin'), updateUserRole);


// --- Old test routes (optional, can be removed if no longer needed for testing) ---
router.get('/admin-only', protect, authorizeRoles('admin'), (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}! This is an Admin-only area.` });
});
router.get('/manager-or-admin', protect, authorizeRoles('manager', 'admin'), (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}! This area is for Managers or Admins.` });
});


module.exports = router;