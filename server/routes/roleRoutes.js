const express = require('express');
const router = express.Router();
const { getAllRoles, createRole, updateRole,getRoleById,deleteRole } = require('../controllers/roleController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const { logAction } = require('../middleware/auditMiddleware');
router.route('/')
    .get(protect, checkPermission('role:read'),logAction('role'), getAllRoles)
    .post(protect, checkPermission('role:create'),logAction('role'), createRole);

router.route('/:id')
    .get(protect, checkPermission('role:read'),logAction('role'), getRoleById) // <-- YEH NAYI LINE
    .put(protect, checkPermission('role:update'),logAction('role'), updateRole)
    .delete(protect, checkPermission('role:delete'),logAction('role'), deleteRole);

    module.exports = router;

