const express = require('express');
const router = express.Router();
const { generatePayslips, getPayslips } = require('../controllers/payrollController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const { logAction } = require('../middleware/auditMiddleware');
// 'salary:create' aur 'salary:read' permissions humne seeder mein banayi theen
router.post('/generate', protect, checkPermission('salary:create'),logAction('salary'), generatePayslips);
router.get('/', protect, checkPermission('salary:read'), logAction('salary'), getPayslips);

module.exports = router;