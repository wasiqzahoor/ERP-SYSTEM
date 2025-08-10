// server/routes/userRoutes.js

const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
    getAllUsers,
    getUserById,
    updateUserStatus,
    createStaffUser, 
    updateUserRole,  
    getPendingUsers, 
} = require('../controllers/userController');

const router = express.Router();

// --- Public/Current User Profile Routes ---
router.get('/profile', protect, (req, res) => {
    res.json({
        message: 'Your profile fetched successfully',
        user: req.user,
    });
});

router.post('/staff', protect, authorizeRoles('admin'), createStaffUser);

router.get('/', protect, authorizeRoles('admin', 'manager'), getAllUsers);

router.get('/pending', protect, authorizeRoles('admin', 'manager'), getPendingUsers);

router.get('/:id', protect, authorizeRoles('admin', 'manager'), getUserById);

router.put('/:id/status', protect, authorizeRoles('admin', 'manager'), updateUserStatus);

router.put('/:id/role', protect, authorizeRoles('admin'), updateUserRole);


// --- Old test routes (optional, can be removed if no longer needed for testing) ---
router.get('/admin-only', protect, authorizeRoles('admin'), (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}! This is an Admin-only area.` });
});
router.get('/manager-or-admin', protect, authorizeRoles('manager', 'admin'), (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}! This area is for Managers or Admins.` });
});



module.exports = router;