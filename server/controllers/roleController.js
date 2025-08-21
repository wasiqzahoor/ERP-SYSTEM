// server/controllers/roleController.js
const Role = require('../models/roleModel');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (Requires 'role:read')
exports.getAllRoles = async (req, res) => {
    try {
        // Hum ab Role.find() mein shart (condition) lagayeinge ke
        // sirf woh roles find karo jinka 'tenant' field mojooda user ke tenant se match karta hai.
        const roles = await Role.find({ tenant: req.tenant._id })
            .populate('permissions', 'key'); // Permissions poori fetch karne ke bajaye sirf 'key' field lein.

        res.status(200).json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ message: 'Server error fetching roles.' });
    }
};
// @desc    Create a new role
// @route   POST /api/roles
// @access  Private (Requires 'role:create')
exports.createRole = async (req, res) => {
    const { name, description, permissions } = req.body;
    try {
        // Naya role banate waqt, tenant ID ko bhi save karein.
        const role = new Role({ 
            name, 
            description, 
            permissions,
            tenant: req.tenant._id // <-- Yeh line zaroori hai
        });
        await role.save();
        res.status(201).json(role);
    } catch (error) {
         if (error.code === 11000) {
            return res.status(400).json({ message: 'A role with this name already exists in your company.' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a role (including its permissions)
// @route   PUT /api/roles/:id
// @access  Private (Requires 'role:update')
exports.updateRole = async (req, res) => {
    const { name, description, permissions } = req.body;
    try {
        const role = await Role.findByIdAndUpdate(
            req.params.id, 
            { name, description, permissions }, 
            { new: true, runValidators: true } // new: true returns the updated document
        );
        if (!role) return res.status(404).json({ message: 'Role not found' });
        res.status(200).json(role);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id).populate('permissions');
        
        if (!role) {
            return res.status(404).json({ message: 'Role not found.' });
        }
        
        // Security check: Role usi tenant ka hona chahiye
        if (role.tenant.toString() !== req.tenant._id.toString()) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching role.' });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        // Find by ID and delete
        const role = await Role.findByIdAndDelete(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};