// server/controllers/auditLogController.js
const AuditLog = require('../models/auditLogModel');
const User = require('../models/userModel'); 
// @desc    Get all activity logs for the current tenant
// @route   GET /api/logs
// @access  Private (Admin/Manager)

exports.getActivityLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;

        // --- NAYI FILTERING LOGIC ---
        const { user, module, startDate, endDate } = req.query;
        let query = { tenant: req.tenant._id };

        if (user) query.user = user; // user ki ID
        if (module) query.module = module;
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        // --- LOGIC KHATAM ---

        const [logs, totalLogs] = await Promise.all([
            AuditLog.find(query)
                .populate('user', 'username avatar') // Avatar bhi fetch karein
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip),
            AuditLog.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalLogs / limit);

        res.status(200).json({ logs, currentPage: page, totalPages });

    } catch (error) {
        res.status(500).json({ message: 'Server error fetching activity logs.' });
    }
};

exports.getLogFilterOptions = async (req, res) => {
    try {
        const [users, modules] = await Promise.all([
            User.find({ tenant: req.tenant._id }).select('username _id'),
            AuditLog.distinct('module', { tenant: req.tenant._id })
        ]);
        res.status(200).json({ users, modules });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching filter options.' });
    }
};