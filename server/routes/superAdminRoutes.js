const express = require('express');
const router = express.Router();
const { getSuperAdminStats, getAllTenants, createTenantWithAdmin, updateTenantStatus, deleteTenant, getTenantFullDetails,impersonateTenantAdmin } = require('../controllers/superAdminController');
const { protect, isSuperAdmin } = require('../middleware/authMiddleware');

// Saare routes ko 'protect' aur 'isSuperAdmin' middleware se secure karein
router.use(protect, isSuperAdmin);
router.post('/tenants/:tenantId/impersonate', impersonateTenantAdmin);
router.get('/stats', getSuperAdminStats);
router.get('/tenants', getAllTenants);
router.post('/tenants', createTenantWithAdmin);
router.get('/tenants/:id/full-details', getTenantFullDetails);
router.patch('/tenants/:id/status', updateTenantStatus);
router.delete('/tenants/:id', deleteTenant);

module.exports = router;