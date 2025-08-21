const express = require('express');
const router = express.Router();
const { getAllPermissions } = require('../controllers/permissionController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const { logAction } = require('../middleware/auditMiddleware');
router.get('/', protect, checkPermission('permission:read'),logAction('permission'), getAllPermissions);

module.exports = router;