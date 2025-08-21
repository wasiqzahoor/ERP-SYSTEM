const express = require('express');
const router = express.Router();
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,    // <-- Import new function
    deleteAllNotifications // <-- Import new function
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// --- UPDATE THIS ROUTE TO INCLUDE DELETE ---
router.route('/')
    .get(getNotifications)
    .delete(deleteAllNotifications); // <-- Add delete handler

router.patch('/read-all', markAllAsRead);

// --- UPDATE THIS ROUTE TO INCLUDE DELETE ---
router.route('/:id')
    .delete(deleteNotification); // <-- Add delete handler

router.patch('/:id/read', markAsRead);


module.exports = router;