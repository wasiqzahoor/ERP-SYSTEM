// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// Middlewares aur Models ko import karein
const { protect, checkPermission } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const Tenant = require('../models/tenantModel'); // Tenant model ko import karna zaroori hai
const { generateTwoFactorSecret, verifyTwoFactorToken } = require('../controllers/authController');
// Controller se saare functions import karein
const {
    updateUserProfile,
    updateUserAvatar,
    createStaffUser,
    getAllUsers,
    getPendingUsers,
    getUserById,
    updateUserDetails,
    updateUserStatus,
    createEmployee,
    deleteUser,
    assignDepartment
} = require('../controllers/userController');
const { logAction } = require('../middleware/auditMiddleware');
// --- 1. CURRENT USER'S ROUTES (SELF-ACTIONS) ---
// In routes ko sab se pehle rakhein taake '/profile' waghera ID se conflict na karein.

router.route('/profile')
    .get(protect, async (req, res) => {
        try {
            if (req.user && !req.user.isSuperAdmin && req.user.tenant) {
                req.tenant = await Tenant.findById(req.user.tenant);
            }
            
            // --- YEH HAI ASAL CHANGE ---
            const userProfile = await User.findById(req.user.id)
                .select('-password -verificationCode')
                .populate('tenant', 'name subdomain') // <-- TENANT KO POPULATE KAREIN
                .populate({
                    path: 'roles',
                    populate: { path: 'permissions', model: 'Permission' }
                })
                .populate('department', 'name');

            if (!userProfile) {
                return res.status(404).json({ message: "User not found" });
            }
            
            res.json(userProfile);

        } catch (error) {
            console.error("Error in /profile route:", error);
            res.status(500).json({ message: 'Error fetching profile.' });
        }
    })
    // Profile update karne ke liye permission zaroori hai
    .put(protect, checkPermission('user:update'), updateUserProfile);


// Avatar update karne ke liye bhi permission zaroori hai
router.post('/profile/avatar', protect, checkPermission('user:update'), upload.single('avatar'),logAction('user'), updateUserAvatar);
router.post('/2fa/generate', protect, generateTwoFactorSecret);

router.post('/employee', protect, checkPermission('user:create'),logAction('user'), createEmployee);
// User jo token dega, usay verify karne ke liye
router.post('/2fa/verify', protect,logAction('user'), verifyTwoFactorToken);

// --- 2. ADMIN/MANAGER ROUTES (ACTIONS ON OTHER USERS) ---

// Naya staff member banana (yeh shayad ab zaroori nahi, lekin rakha hai)
router.post('/staff', protect, checkPermission('user:create'),logAction('user'), createStaffUser);

// Users ki list get karna
router.get('/', protect, checkPermission('user:read'),logAction('user'), getAllUsers);
router.get('/pending', protect, checkPermission('user:read'),logAction('user'), getPendingUsers);

// User ko department assign karna
router.put('/assign-department', protect, checkPermission('user:update'), logAction('user'),assignDepartment);


// --- 3. DYNAMIC ROUTES FOR SPECIFIC USERS (BY ID) ---
// Yeh routes hamesha aakhir mein aane chahiye.

// Ek user ki details get karna
router.get('/:id', protect, checkPermission('user:read'),logAction('user'), getUserById);

// Ek user ka status badalna (active/inactive)
router.put('/:id/status', protect, checkPermission('user:update'),logAction('user'), updateUserStatus);

// Ek user ke roles aur permissions ko ek saath update karna
router.put('/:id/permissions', protect, checkPermission('user:update'),logAction('user'), updateUserDetails);

// Ek user ko delete karna
router.delete('/:id', protect, checkPermission('user:delete'),logAction('user'), deleteUser);


module.exports = router;