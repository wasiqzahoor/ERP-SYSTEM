// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { generateSalesReport,getSalesReportData, getInventoryReportData,
    getAttendanceReportData,getUserPermissionsReportData } = require('../controllers/reportController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const { logAction } = require('../middleware/auditMiddleware');
// 'dashboard:read' permission wale user hi reports dekh sakte hain
router.get('/sales', protect, checkPermission('dashboard:read'),logAction('dashboard'), generateSalesReport);
router.get('/sales-data', protect, checkPermission('dashboard:read'),logAction('dashboard'), getSalesReportData);
router.get('/inventory-data', protect, checkPermission('dashboard:read'), logAction('dashboard'),getInventoryReportData);
router.get('/attendance-data', protect, checkPermission('dashboard:read'),logAction('dashboard'), getAttendanceReportData);
router.get('/user-permissions', protect, checkPermission('dashboard:read'),logAction('dashboard'), getUserPermissionsReportData);
module.exports = router;