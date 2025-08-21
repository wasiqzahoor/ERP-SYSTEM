const Notification = require('../models/notificationModel');

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        // User ki saari notifications, sab se nayi pehle
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(20); // Sirf 20 taza notifications bhejein taake performance aachi rahe

        // Unread notifications ka count alag se ginein
        const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

        res.status(200).json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: 'Server error fetching notifications.' });
    }
};


// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            // Sirf woh notification update ho jo is user ki ho
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found or you are not authorized.' });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: 'Server error.' });
    }
};


// @desc    Mark all notifications as read for the logged-in user
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id // Ensure users can only delete their own notifications
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        res.status(200).json({ message: 'Notification deleted.' });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });
        res.status(200).json({ message: 'All notifications have been cleared.' });
    } catch (error) {
        console.error("Error clearing notifications:", error);
        res.status(500).json({ message: 'Server error.' });
    }
};