// server/routes/auditLogRoutes.js
const express = require('express');
const router = express.Router();
const { getActivityLogs,getLogFilterOptions } = require('../controllers/auditLogController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Hum yeh farz kar rahe hain ke 'user:read' permission wala hi logs dekh sakta hai.
// Aap chahein to 'auditlog:read' ki nayi permission bhi bana sakte hain.
router.route('/')
    .get(protect, checkPermission('user:read'), getActivityLogs);
router.route('/filters')
    .get(protect, checkPermission('user:read'), getLogFilterOptions);
module.exports = router;