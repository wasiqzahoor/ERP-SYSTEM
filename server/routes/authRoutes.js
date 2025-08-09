// server/routes/authRoutes.js

const express = require('express');
const { registerUser, authUser } = require('../controllers/authController'); // Import controller functions

const router = express.Router();

// Public routes for authentication
router.post('/register', registerUser);
router.post('/login', authUser);

module.exports = router;