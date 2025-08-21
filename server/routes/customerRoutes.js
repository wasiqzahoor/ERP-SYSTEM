const express = require('express');
const router = express.Router();
const { 
    createCustomer, 
    getAllCustomers, 
    updateCustomer, 
    deleteCustomer 
} = require('../controllers/customerController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const { logAction } = require('../middleware/auditMiddleware');
// Aap 'customer:create', 'customer:read' jaisi specific permissions bhi bana sakte hain.
// Abhi ke liye hum sales se related permissions istemal kar rahe hain.
router.route('/')
    .post(protect, checkPermission('order:create'),logAction('order'), createCustomer)
    .get(protect, checkPermission('order:read'),logAction('order'), getAllCustomers);

router.route('/:id')
    .put(protect, checkPermission('order:update'),logAction('order'), updateCustomer)
    .delete(protect, checkPermission('order:delete'),logAction('order'), deleteCustomer);

module.exports = router;