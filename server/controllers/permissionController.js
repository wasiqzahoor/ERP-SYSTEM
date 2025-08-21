// server/controllers/permissionController.js
const Permission = require('../models/permissionModel');

// @desc    Get all permissions, grouped by module
// @route   GET /api/permissions
// @access  Private (Requires 'permission:read')
exports.getAllPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find({});
        // Permissions ko module ke hisab se group karein
        const groupedPermissions = permissions.reduce((acc, permission) => {
            const module = permission.module;
            if (!acc[module]) {
                acc[module] = [];
            }
            acc[module].push(permission);
            return acc;
        }, {});
        res.status(200).json(groupedPermissions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};