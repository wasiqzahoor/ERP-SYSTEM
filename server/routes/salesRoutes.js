const express = require('express');
const router = express.Router();
const { getAllOrders, generateInvoice, createOrder, updateOrderStatus } = require('../controllers/salesController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const { logAction } = require('../middleware/auditMiddleware');
// Route to get all orders and create a new order
router.route('/orders')
    .get(protect, checkPermission('order:read'),logAction('order'), getAllOrders)
    .post(protect, checkPermission('order:create'),logAction('order'), createOrder); // <-- YEH ROUTE ADD KAREIN

// Route to get a specific order's invoice
router.get('/orders/:orderId/invoice', protect, checkPermission('invoice:read'),logAction('invoice'), generateInvoice);
router.put('/orders/:orderId/status', protect, checkPermission('order:update'),logAction('order'), updateOrderStatus);
module.exports = router;