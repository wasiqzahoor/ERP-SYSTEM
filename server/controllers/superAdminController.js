const mongoose = require('mongoose'); 
const Tenant = require('../models/tenantModel');
const User = require('../models/userModel');
const Role = require('../models/roleModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Customer = require('../models/customerModel');
const Attendance = require('../models/attendanceModel');
const AuditLog = require('../models/auditLogModel');
const Permission = require('../models/permissionModel');
const jwt = require('jsonwebtoken');
exports.getSuperAdminStats = async (req, res) => {
    try {
        // Hum teeno counts alag-alag aur sahi tareeqe se fetch karenge
        const [
            totalTenants,
            activeTenants,
            inactiveTenants
        ] = await Promise.all([
            // 1. Total companies (yeh theek hai)
            Tenant.countDocuments(),

            // 2. Active companies (naya, theek logic)
            Tenant.countDocuments({
                $or: [
                    { status: 'active' },      // Jinka status 'active' hai
                    { status: { $exists: false } } // Ya jinke paas status ki field hi nahi hai
                ]
            }),
            
            // 3. Inactive companies (yeh aasan hai)
            Tenant.countDocuments({ status: 'inactive' })
        ]);

        res.status(200).json({
            totalTenants,
            activeTenants,
            inactiveTenants
        });

    } catch (error) {
        console.error("Error fetching super admin stats:", error);
        res.status(500).json({ message: 'Server error fetching stats.' });
    }
};

exports.getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find().sort({ createdAt: -1 });
        
        // Har tenant ke liye uske users aur products ka count fetch karein
        const tenantsWithDetails = await Promise.all(tenants.map(async (tenant) => {
            const [userCount, productCount] = await Promise.all([
                User.countDocuments({ tenant: tenant._id }),
                Product.countDocuments({ tenant: tenant._id })
            ]);
            // .lean() istemal karein taake Mongoose document ko plain object bana de
            const tenantObj = tenant.toObject(); 
            return { ...tenantObj, userCount, productCount };
        }));

        res.status(200).json(tenantsWithDetails);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching tenants.' });
    }
};

exports.createTenantWithAdmin = async (req, res) => {
    const { companyName, adminUsername, adminEmail, adminPassword } = req.body;

    // Input validation
    if (!companyName || !adminUsername || !adminEmail || !adminPassword) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    if (adminPassword.length < 6) {
        return res.status(400).json({ message: 'Admin password must be at least 6 characters long.'});
    }

    try {
        // Step 1: Create the new Tenant
        const subdomain = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const newTenant = await Tenant.create({ name: companyName, subdomain });

        // Step 2: Fetch all available permissions from the database
        const allPermissions = await Permission.find({});
        const allPermissionIds = allPermissions.map(p => p._id);
        
        // Step 3: Create both the 'Admin' and 'Employee' roles for the new tenant at the same time
        const [adminRole] = await Promise.all([
            Role.create({
                name: 'Admin',
                description: 'Administrator for the tenant with full permissions',
                tenant: newTenant._id,
                permissions: allPermissionIds // Assign all permissions to the Admin
            }),
            Role.create({
                name: 'Employee',
                description: 'Basic user with limited access',
                tenant: newTenant._id,
                permissions: [] // Employees start with no permissions by default
            })
        ]);

        // Step 4: Create the new Admin User for this tenant
        const newAdmin = await User.create({
            username: adminUsername,
            email: adminEmail,
            password: adminPassword,
            tenant: newTenant._id,
            roles: [adminRole._id], // Assign the newly created 'Admin' role
            status: 'active'
        });

        // Step 5: Send a clean, successful response back to the frontend
        res.status(201).json({ 
            message: 'Company, default roles, and Admin user created successfully.',
            tenant: {
                _id: newTenant._id,
                name: newTenant.name,
                subdomain: newTenant.subdomain,
                status: newTenant.status
            },
            admin: {
                _id: newAdmin._id,
                username: newAdmin.username,
                email: newAdmin.email
            } 
        });

    } catch (error) {
        // Handle potential errors, like duplicate data
        console.error("Error in createTenantWithAdmin:", error);
        if (error.code === 11000) {
            // Figure out which field was duplicated for a better error message
            let duplicateField = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `A user or company with this ${duplicateField} already exists.` });
        }
        res.status(500).json({ message: 'A server error occurred while creating the company.', error: error.message });
    }
};

exports.updateTenantStatus = async (req, res) => {
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }
    try {
        const tenant = await Tenant.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });
        res.status(200).json(tenant);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating status.' });
    }
};

exports.deleteTenant = async (req, res) => {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid Tenant ID format.' });
    }
    const tenantObjectId = new mongoose.Types.ObjectId(req.params.id);

    try {
        // Promise.all ka matlab hai ke yeh saare kaam ek saath shuru honge
        await Promise.all([
            // Qadam 1: Tenant ko khud delete karo
            Tenant.findByIdAndDelete(tenantObjectId),

            // Qadam 2: Us tenant ke saare USERS ko delete karo
            User.deleteMany({ tenant: tenantObjectId }),

            // Qadam 3: Us tenant ke saare ROLES ko delete karo
            Role.deleteMany({ tenant: tenantObjectId }),
            
            // Qadam 4: Us tenant ke saare PRODUCTS ko delete karo
            Product.deleteMany({ tenant: tenantObjectId }),
            
            // Qadam 5: Us tenant ke saare ORDERS ko delete karo
            Order.deleteMany({ tenant: tenantObjectId }),
            
            // Aapko yahan par apne baqi sab models bhi add karne honge
            // e.g., Customer, Attendance, etc.
            Customer.deleteMany({ tenant: tenantObjectId }),
            Attendance.deleteMany({ tenant: tenantObjectId }),
        ]);
        
        res.status(200).json({ message: 'Tenant and all associated data deleted successfully.' });

    } catch (error) {
         res.status(500).json({ message: 'Server error deleting tenant.' });
    }
};

exports.getTenantFullDetails = async (req, res) => {
    try {
        const tenantId = new mongoose.Types.ObjectId(req.params.id);

        const [
            tenant,
            userCount,
            productCount,
            salesData,
            recentOrders,
            lowStockItems
        ] = await Promise.all([
            Tenant.findById(tenantId),
            User.countDocuments({ tenant: tenantId }),
            Product.countDocuments({ tenant: tenantId }),
            Order.aggregate([
                { $match: { tenant: tenantId, status: 'Paid' } },
                { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
            ]),
            Order.find({ tenant: tenantId }).sort({ createdAt: -1 }).limit(5).populate('customer', 'name'),
            Product.find({ tenant: tenantId }).sort({ stock: 1 }).limit(5)
        ]);

        if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

        res.status(200).json({
            details: tenant,
            stats: {
                userCount,
                productCount,
                totalSales: salesData.length > 0 ? salesData[0].totalSales : 0
            },
            recentOrders,
            lowStockItems
        });
    } catch (error) {
        console.error("Error fetching full tenant details:", error);
        res.status(500).json({ message: 'Server error fetching tenant details.' });
    }
};
exports.impersonateTenantAdmin = async (req, res) => {
    try {
        const { tenantId } = req.params;

        // Step 1: Us company ka "Admin" role find karein
        const adminRole = await Role.findOne({ tenant: tenantId, name: 'Admin' });
        if (!adminRole) {
            return res.status(404).json({ message: 'Admin role not found for this tenant.' });
        }

        // Step 2: Us company ka pehla Admin user find karein
        // Aam tor par ek hi Admin hota hai, lekin hum pehla le leinge
        const tenantAdmin = await User.findOne({ tenant: tenantId, roles: adminRole._id });
        if (!tenantAdmin) {
            return res.status(404).json({ message: 'No admin user found for this tenant.' });
        }

        // Step 3: Us Admin user ke liye ek naya JWT token generate karein
        // Yeh token 1 ghante ke liye valid hoga
        const impersonationToken = jwt.sign(
            { id: tenantAdmin._id }, // Token mein Admin ki ID hogi
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token ki expiry
        );

        // Step 4: Frontend ko naya token aur tenant ki details bhejein
        res.status(200).json({
            token: impersonationToken,
            tenantSubdomain: (await Tenant.findById(tenantId)).subdomain
        });

    } catch (error) {
        console.error("Impersonation error:", error);
        res.status(500).json({ message: "Server error during impersonation." });
    }
};