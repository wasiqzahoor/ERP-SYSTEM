const express = require('express');
const router = express.Router();
const { 
    getAllDepartments, 
    createDepartment, 
    getDepartmentDetails, 
    updateDepartment, 
    deleteDepartment 
} = require('../controllers/departmentController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const { logAction } = require('../middleware/auditMiddleware');
// --- Base Route: /api/departments ---
// Handles getting all departments and creating a new one.
router.route('/')
    .get(protect, checkPermission('user:read'),logAction('user'), getAllDepartments)
    .post(protect, checkPermission('user:create'),logAction('user'), createDepartment);

// --- Route with ID: /api/departments/:id ---
// Handles actions on a single, specific department.
router.route('/:id')
    .get(protect, checkPermission('user:read'),logAction('user'), getDepartmentDetails)
    .put(protect, checkPermission('user:update'),logAction('user'), updateDepartment)
    .delete(protect, checkPermission('user:delete'),logAction('user'), deleteDepartment);

module.exports = router;