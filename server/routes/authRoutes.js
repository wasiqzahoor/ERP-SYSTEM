// server/routes/authRoutes.js

const express = require('express');
const { registerUser, authUser,getUserStatus ,sendVerificationCode, verifyAndRegister, forgotPassword,
    resetPassword  } = require('../controllers/authController'); // Import controller functions

const router = express.Router();

// Public routes for authentication
router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/status/:userId', getUserStatus);
router.post('/send-verification', sendVerificationCode);
router.post('/verify-register', verifyAndRegister);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
module.exports = router;