const Department = require('../models/departmentModel');
const User = require('../models/userModel');

exports.getAllDepartments = async (req, res) => {
    try {
        const user = req.user; 
        const populatedUser = await User.findById(user._id).populate('roles');
        
        const userHasRole = (roleName) => {
            return populatedUser.roles.some(role => role.name.toLowerCase() === roleName.toLowerCase());
        };

        let query = { tenant: req.tenant._id };

        if (!user.isSuperAdmin && !userHasRole('admin') && user.department) {
            
            query._id = user.department;
        }

        const departments = await Department.find(query);
        
        res.status(200).json(departments);

    } catch (error) {
        console.error('Error fetching departments:', error.message);
        res.status(500).json({ message: 'Server error fetching departments.' });
    }
};

exports.createDepartment = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Department name is required.' });
    }

    try {
        const department = await Department.create({
            name,
            tenant: req.tenant._id,
        });
        res.status(201).json(department);
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ message: 'A department with this name already exists.' });
        }
        res.status(500).json({ message: 'Server error creating department.' });
    }
};


exports.getDepartmentDetails = async (req, res) => {
    try {
        const departmentId = req.params.id;
        
        const [department, users] = await Promise.all([
            Department.findOne({ _id: departmentId, tenant: req.tenant._id }),
            User.find({ department: departmentId, tenant: req.tenant._id }).populate('roles', 'name')
        ]);

        if (!department) {
            return res.status(404).json({ message: 'Department not found.' });
        }

        res.status(200).json({ department, users });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching department details.' });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const department = await Department.findOneAndUpdate(
            { _id: req.params.id, tenant: req.tenant._id },
            { name: req.body.name },
            { new: true, runValidators: true }
        );
        if (!department) return res.status(404).json({ message: 'Department not found.' });
        res.status(200).json(department);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findOne({ _id: req.params.id, tenant: req.tenant._id });
        if (!department) return res.status(404).json({ message: 'Department not found.' });
        
        // Ahem: Department delete karne se pehle saare users ko us se nikal dein
        await User.updateMany({ department: req.params.id }, { $set: { department: null } });
        
        await department.deleteOne();
        res.status(200).json({ message: 'Department deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting department.' });
    }
};