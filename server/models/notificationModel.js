const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Jis user ko notification bhejni hai
    message: { type: String, required: true },
    link: { type: String }, // e.g., '/requests'
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);