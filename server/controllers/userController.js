// server/controllers/userController.js

const User = require('../models/userModel');

// @desc    Create a new staff user (Admin or Manager) by an Admin
// @route   POST /api/users/staff
// @access  Private (Admin only)
exports.createStaffUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    // sirf 'admin' aur 'manager' roles hi is endpoint se create ho sakte hain
    if (!role || !['admin', 'manager'].includes(role)) {
        return res.status(400).json({ message: 'Only Admin or Manager roles can be created via this endpoint.' });
    }

    // <--- IMPORTANT: Sirf Admin hi doosre Admin accounts bana sakta hai
    if (role === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only an Admin can create another Admin account.' });
    }

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all required fields: username, email, password.' });
    }

    try {
        let userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists.' });
        }

        const user = new User({
            username,
            email,
            password,
            role,         // Specified role (admin or manager)
            status: 'active', // <--- IMPORTANT: Staff accounts created by admin are 'active' by default
        });

        await user.save();

        res.status(201).json({
            message: `${role} account created successfully.`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });

    } catch (error) {
        console.error('Error creating staff user:', error.message);
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ message: 'A user with this email or username already exists.' });
        }
        res.status(500).json({ message: 'Server error during staff user creation.' });
    }
};


// @desc    Get all users (Admin can see all, Manager can see employees & managers)
// @route   GET /api/users
// @access  Private (Admin, Manager)
exports.getAllUsers = async (req, res) => {
    try {
        let query = {};
        // <--- IMPORTANT: Manager sirf employees aur doosre managers ko hi dekh sakta hai
        if (req.user.role === 'manager') {
            query = { role: { $in: ['employee', 'manager'] } };
        }

        const users = await User.find(query).select('-password -__v'); // password aur __v field exclude karenge
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching all users:', error.message);
        res.status(500).json({ message: 'Server error fetching users.' });
    }
};

// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin, Manager can view employees/managers, User can view self)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -__v');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // <--- IMPORTANT: Manager Admin profiles ko view nahi kar sakta
        if (req.user.role === 'manager' && user.role === 'admin') {
            return res.status(403).json({ message: 'Managers cannot view Admin profiles.' });
        }
        // General access check: Admin/Manager can view anyone; Employee can view only themselves
        if (req.user.role === 'employee' && req.user._id.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this profile.' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user by ID:', error.message);
        if (error.kind === 'ObjectId') { // Handle invalid MongoDB ID format
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        res.status(500).json({ message: 'Server error fetching user.' });
    }
};


// @desc    Update a user's status by Admin/Manager
// @route   PUT /api/users/:id/status
// @access  Private (Admin, Manager)
exports.updateUserStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    const allowedStatuses = ['pending', 'active', 'inactive', 'terminated'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status provided. Allowed: ${allowedStatuses.join(', ')}` });
    }

    try {
        const userToUpdate = await User.findById(id);

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // <--- IMPORTANT: Authorization checks for updating status
        // Manager Admin ya doosre Manager accounts ka status change nahi kar sakta
        if (req.user.role === 'manager' && ['admin', 'manager'].includes(userToUpdate.role)) {
            return res.status(403).json({ message: 'Managers cannot change status of Admin or other Manager accounts.' });
        }

        // Admin khud ka status inactive ya terminated nahi kar sakta (security safeguard)
        if (req.user.role === 'admin' && req.user._id.toString() === userToUpdate._id.toString() && (status === 'inactive' || status === 'terminated')) {
            return res.status(403).json({ message: 'Admin cannot change their own status to inactive or terminated via this endpoint.' });
        }

        // Admin doosre Admin accounts ko terminate nahi kar sakta (high-level safeguard)
        if (req.user.role === 'admin' && userToUpdate.role === 'admin' && status === 'terminated' && req.user._id.toString() !== userToUpdate._id.toString()) {
            return res.status(403).json({ message: 'Admin cannot terminate another Admin account through this endpoint.' });
        }


        userToUpdate.status = status;
        await userToUpdate.save();

        res.status(200).json({
            message: `User ${userToUpdate.username}'s status updated to ${status}.`,
            user: {
                id: userToUpdate._id,
                username: userToUpdate.username,
                email: userToUpdate.email,
                role: userToUpdate.role,
                status: userToUpdate.status,
            },
        });

    } catch (error) {
        console.error('Error updating user status:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        res.status(500).json({ message: 'Server error updating user status.' });
    }
};

// @desc    Update a user's role by Admin
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
    const { role } = req.body;
    const { id } = req.params;

    const allowedRoles = ['admin', 'manager', 'employee'];
    if (!role || !allowedRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid role provided. Allowed: ${allowedRoles.join(', ')}` });
    }

    try {
        const userToUpdate = await User.findById(id);

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // <--- IMPORTANT: Admin khud ka role change nahi kar sakta
        if (req.user._id.toString() === userToUpdate._id.toString()) {
            return res.status(403).json({ message: 'Admin cannot change their own role.' });
        }

        // Admin doosre Admin ke role ko non-admin mein demote nahi kar sakta
        if (userToUpdate.role === 'admin' && role !== 'admin') {
            return res.status(403).json({ message: 'Cannot demote an Admin account via this endpoint.' });
        }

        userToUpdate.role = role;
        await userToUpdate.save();

        res.status(200).json({
            message: `User ${userToUpdate.username}'s role updated to ${role}.`,
            user: {
                id: userToUpdate._id,
                username: userToUpdate.username,
                email: userToUpdate.email,
                role: userToUpdate.role,
                status: userToUpdate.status,
            },
        });

    } catch (error) {
        console.error('Error updating user role:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        res.status(500).json({ message: 'Server error updating user role.' });
    }
};