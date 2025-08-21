// server/controllers/userController.js

const User = require('../models/userModel');
const Role = require('../models/roleModel');


exports.createStaffUser = async (req, res) => {
    // Ab hum role ka naam (e.g., "Manager") nahi, balke role ki ID lenge
    const { username, email, password, roleId } = req.body;

    if (!roleId) {
        return res.status(400).json({ message: 'Role ID is required.' });
    }
    // ... (other validations)

    try {
        const roleExists = await Role.findById(roleId);
        if (!roleExists) {
            return res.status(400).json({ message: 'Invalid Role ID.' });
        }
        // ... (check for existing user, etc.)

        const user = new User({
            username,
            email,
            password,
            roles: [roleId], // Role ID ko array mein assign karein
            status: 'active',
        });

        await user.save();
        res.status(201).json({ /* ... success message ... */ });
    } catch (error) {
        // ... (error handling)
    }
};


exports.getUserById = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, tenant: req.tenant._id })
            .select('-password') // Password ke ilawa sab kuch
            .populate('department', 'name') // Department ki details
            .populate({ // Roles aur unki permissions
                path: 'roles',
                select: 'name',
                populate: {
                    path: 'permissions',
                    select: 'key module action'
                }
            })
            .populate({ // Permission overrides
                path: 'permissionOverrides.permission',
                select: 'key module action'
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found in this company.' });
        }
        res.status(200).json(user); // user variable ka naam theek kar diya
    } catch (error) {
        console.error('Error fetching user by ID:', error.message);
        if (error.kind === 'ObjectId') { // Handle invalid MongoDB ID format
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        res.status(500).json({ message: 'Server error fetching user.' });
    }
};

exports.updateUserRoles = async (req, res) => {
    try {
        const { roles } = req.body; // Expecting an array of Role IDs
        const userToUpdate = await User.findById(req.params.id);
        
        if (!userToUpdate) return res.status(404).json({ message: 'User not found.' });

        // Hierarchy check (aapka pehle wala logic yahan aayega, agar hai to)
        // ...
        
        userToUpdate.roles = roles;
        await userToUpdate.save();
        
        // Updated user ko populate karke wapis bhejein taake UI refresh ho sake
        const updatedUser = await User.findById(req.params.id).populate('roles', 'name');

        res.status(200).json({ 
            message: `Roles for ${updatedUser.username} have been updated.`,
            user: updatedUser 
        });

    } catch (error) {
        console.error("Error updating user roles:", error);
        res.status(500).json({ message: 'Server error while updating roles.' });
    }
};


exports.getPendingUsers = async (req, res) => {
    try {
        // --- ADD THESE DEBUGGING LINES ---
        console.log("--- Fetching Pending Users ---");
        if (req.tenant) {
            console.log("Request is for Tenant ID:", req.tenant._id);
        } else {
            console.log("ERROR: Tenant information is MISSING on the request object!");
            return res.status(500).json({ message: 'Tenant context not found.' });
        }
        
        const pendingUsers = await User.find({ 
            status: 'pending',
            tenant: req.tenant._id
        }).select('-password -__v').sort({ createdAt: -1 });

        // Log the result of the database query
        console.log("Found pending users:", pendingUsers.length);
        console.log("--- End Fetch ---");

        res.status(200).json({ users: pendingUsers });
    } catch (error) {
        console.error('Error fetching pending users:', error.message);
        res.status(500).json({ message: 'Server error fetching pending users.' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.bio = req.body.bio || user.bio;
            user.address = req.body.address || user.address;
            user.skills = req.body.skills || user.skills;
            user.education = req.body.education || user.education;
            user.experience = req.body.experience || user.experience;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                // ... return all updated fields
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating profile:', error.message);
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
};

exports.updateUserAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        // Save the URL from Cloudinary to the user's profile
        user.avatar = req.file.path;
        await user.save();
        
        res.status(200).json({
            message: 'Avatar updated successfully.',
            avatarUrl: user.avatar,
        });

    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ message: 'Server error while updating avatar.' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        // --- NAYI LOGIC ---
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        
        const searchTerm = req.query.search || '';
        const roleFilter = req.query.role || '';
        const statusFilter = req.query.status || '';

        // Buniyadi query jo hamesha tenant ke hisab se filter karegi
        let query = { tenant: req.tenant._id };

        // Search term ke hisab se query update karein
        if (searchTerm) {
            query.$or = [
                { username: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Role ke hisab se filter karein
        if (roleFilter) {
            query.roles = roleFilter; // Yahan role ki ID aayegi
        }
        
        // Status ke hisab se filter karein
        if (statusFilter) {
            query.status = statusFilter;
        }

        // --- Manager ki logic wesi hi rahegi ---
        const user = req.user;
        const userRoles = user.roles.map(role => role.name);
        if (userRoles.includes('Manager') && !userRoles.includes('Admin') && user.department) {
            query.department = user.department;
        }

        // --- Data ko ek saath fetch karein ---
        const [users, totalUsers] = await Promise.all([
            User.find(query)
                .populate('roles', 'name')
                .populate('department', 'name')
                .select('-password -__v')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip),
            User.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({ 
            users,
            currentPage: page,
            totalPages,
            totalUsers
        });

    } catch (error) {
        console.error('Error fetching all users:', error.message);
        res.status(500).json({ message: 'Server error fetching users.' });
    }
};

exports.assignDepartment = async (req, res) => {
    try {
        const { userId, departmentId } = req.body;
        const userToUpdate = await User.findById(userId).populate('roles');
        const currentUser = await User.findById(req.user.id).populate('roles');

        if (!userToUpdate) return res.status(404).json({ message: 'User not found.' });

        const currentUserMaxRole = Math.max(...currentUser.roles.map(r => getRolePriority(r.name)));
        const targetUserMaxRole = Math.max(...userToUpdate.roles.map(r => getRolePriority(r.name)));

        if (currentUserMaxRole <= targetUserMaxRole) {
            return res.status(403).json({ message: "Forbidden: You cannot modify a user with an equal or higher role." });
        }

        userToUpdate.department = departmentId;
        await userToUpdate.save();
        res.status(200).json({ message: `Department assigned successfully to ${userToUpdate.username}.` });

    } catch (error) {
        console.error("Error assigning department:", error);
        res.status(400).json({ message: error.message });
    }
};

const getRolePriority = (roleName) => {
    switch (roleName.toLowerCase()) {
        case 'super admin': return 4;
        case 'admin': return 3;
        case 'manager': return 2;
        case 'employee': return 1;
        default: return 0;
    }
};

exports.updateUserStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    const allowedStatuses = ['pending', 'active', 'inactive', 'terminated'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status provided. Allowed: ${allowedStatuses.join(', ')}` });
    }

    try {
        const userToUpdate = await User.findById(id).populate('roles');
        const currentUser = await User.findById(req.user.id).populate('roles');

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // --- NEW: Role Hierarchy Check ---
        const currentUserMaxRole = Math.max(...currentUser.roles.map(r => getRolePriority(r.name)));
        const targetUserMaxRole = Math.max(...userToUpdate.roles.map(r => getRolePriority(r.name)));

        // Authorization check: User cannot modify another user with an equal or higher role.
        if (currentUserMaxRole <= targetUserMaxRole) {
            // Self-modification is allowed if role is lower, but we need an exception for admins.
            if (req.user._id.toString() !== userToUpdate._id.toString()) {
                return res.status(403).json({ message: "Forbidden: You cannot modify a user with an equal or higher role." });
            }
        }

        // --- Critical Safeguard: Admin cannot change their own status to 'inactive' or 'terminated' ---
        if (req.user._id.toString() === userToUpdate._id.toString() && (status === 'inactive' || status === 'terminated')) {
            return res.status(403).json({ message: 'Admin cannot change their own status to inactive or terminated via this endpoint.' });
        }

        // Update the user's status
        userToUpdate.status = status;
        await userToUpdate.save();

        res.status(200).json({
            message: `User ${userToUpdate.username}'s status updated to ${status}.`,
            user: {
                id: userToUpdate._id,
                username: userToUpdate.username,
                email: userToUpdate.email,
                role: userToUpdate.role, // Assuming a simple role field exists, otherwise map from roles array
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

exports.deleteUser = async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id).populate('roles');
        const currentUser = await User.findById(req.user.id).populate('roles');

        if (!userToDelete) return res.status(404).json({ message: 'User not found.' });
        if (currentUser.id === userToDelete.id) return res.status(400).json({ message: "You cannot delete your own account."});

        const currentUserMaxRole = Math.max(...currentUser.roles.map(r => getRolePriority(r.name)));
        const targetUserMaxRole = Math.max(...userToDelete.roles.map(r => getRolePriority(r.name)));

        if (currentUserMaxRole <= targetUserMaxRole) {
            return res.status(403).json({ message: "Forbidden: You cannot delete a user with an equal or higher role." });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: `User ${userToDelete.username} has been deleted.` });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePermissionOverrides = async (req, res) => {
    try {
        const { permissionOverrides } = req.body; // Expecting an array of override objects
        const userToUpdate = await User.findById(req.params.id);

        if (!userToUpdate) return res.status(404).json({ message: 'User not found.' });

        // Hierarchy check (aapka pehle wala logic yahan aayega, agar hai to)
        // ...

        // Overrides ko set karein
        userToUpdate.permissionOverrides = permissionOverrides;
        
        // Mongoose ko batayein ke yeh path modify hua hai
        userToUpdate.markModified('permissionOverrides');

        await userToUpdate.save();

        res.status(200).json({
            message: `Permission overrides for ${userToUpdate.username} updated successfully.`,
        });

    } catch (error) {
        console.error("Error updating overrides:", error);
        res.status(500).json({ message: 'Server error while updating overrides.' });
    }
};

exports.updateUserDetails = async (req, res) => {
    try {
        const { roles, permissionOverrides, salaryStructure, bankDetails } = req.body;
        const userToUpdate = await User.findById(req.params.id);

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Hierarchy checks yahan add kiye ja sakte hain

        // Roles update karein (agar request mein aaye hain)
        if (roles) {
            userToUpdate.roles = roles;
        }
        
        // Permission Overrides update karein
        if (permissionOverrides) {
            userToUpdate.permissionOverrides = permissionOverrides;
            userToUpdate.markModified('permissionOverrides');
        }
        
        // Salary Structure update karein
        if (salaryStructure) {
            userToUpdate.salaryStructure = salaryStructure;
            userToUpdate.markModified('salaryStructure');
        }

        // Bank Details update karein
        if (bankDetails) {
            userToUpdate.bankDetails = bankDetails;
            userToUpdate.markModified('bankDetails');
        }

        // Ab ek hi baar save karein
        const updatedUser = await userToUpdate.save();

        res.status(200).json({
            message: `Details for ${updatedUser.username} have been updated.`,
            user: updatedUser,
        });

    } catch (error) {
        console.error("Error updating user details:", error);
        
        // VersionError ko aachi tarah handle karein
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Conflict: The user data was modified by someone else. Please refresh and try again.' });
        }
        
        res.status(500).json({ message: 'Server error while updating user details.' });
    }
};

exports.createEmployee = async (req, res) => {
    const { username, email, password, roleId, departmentId } = req.body;

    if (!username || !email || !password || !roleId) {
        return res.status(400).json({ message: 'Username, email, password, and role are required.' });
    }

    try {
        const userExists = await User.findOne({ email, tenant: req.tenant._id });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists in this company.' });
        }

        const user = new User({
            username,
            email,
            password, // Password pre-save hook mein hash ho jayega
            roles: [roleId],
            department: departmentId || null, // Agar department nahi to null
            tenant: req.tenant._id,
            status: 'active' // User foran active hoga
        });

        await user.save();

        // Password ke bina user data wapis bhejein
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ 
            message: 'Employee created successfully.',
            user: userResponse 
        });

    } catch (error) {
        console.error("Error creating employee:", error);
        res.status(500).json({ message: 'Server error while creating employee.' });
    }
};

