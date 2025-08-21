const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Route for getting dashboard stats
// Hum yeh farz kar rahe hain ke 'order:read' ya 'user:read' jaisi permission wala hi dashboard dekh sakta hai.
// Aap chahein to 'dashboard:read' ki nayi permission bhi bana sakte hain.
router.get('/stats', protect, checkPermission('user:read'), getDashboardStats);

module.exports = router;