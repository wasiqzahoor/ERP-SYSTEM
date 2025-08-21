// seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load Models
const Permission = require('./models/permissionModel');
const Role = require('./models/roleModel');
const User = require('./models/userModel');
const Tenant = require('./models/tenantModel');
const Department = require('./models/departmentModel');
const Customer = require('./models/customerModel');
const Order = require('./models/orderModel');
const Product = require('./models/productModel');
const Attendance = require('./models/attendanceModel');
const AuditLog = require('./models/auditLogModel');

dotenv.config();

const modules = [
    'User', 'Product', 'Invoice', 'Role', 'Permission', 
    'Department', 'Attendance', 'Salary', 'Order', 'Customer', 
    'Dashboard'
];
const actions = ['create', 'read', 'update', 'delete', 'import', 'export'];

const runSeeder = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB connected for seeder...');

        console.log('Destroying old data...');
        await Promise.all([
            Permission.deleteMany(), Role.deleteMany(), User.deleteMany(),
            Tenant.deleteMany(), Department.deleteMany(), Customer.deleteMany(),
            Order.deleteMany(), Product.deleteMany(), Attendance.deleteMany(),
            AuditLog.deleteMany()
        ]);
        console.log('Old data destroyed.');

        const permissionsToCreate = [];
        for (const module of modules) {
            for (const action of actions) {
                permissionsToCreate.push({ 
                    module: module, 
                    action: action,
                    key: `${module.toLowerCase()}:${action.toLowerCase()}` 
                });
            }
        }
        const createdPermissions = await Permission.insertMany(permissionsToCreate);
        console.log(`${createdPermissions.length} permissions created.`);

        const defaultTenant = await Tenant.create({ 
            name: 'Default Company', 
            subdomain: 'default',
            status: 'active'
        });
        console.log('Default tenant created.');
        
        await Department.create({ name: 'Human Resources', tenant: defaultTenant._id });
        await Department.create({ name: 'Sales', tenant: defaultTenant._id });
        console.log('Default departments created.');

        // --- ROLES BANANE KA SECTION (FINAL VERSION) ---

        // 1. Super Admin & Admin Roles (saari permissions)
        const allPermissionIds = createdPermissions.map(p => p._id);
        const superAdminRole = await Role.create({
            name: 'Super Admin',
            description: 'System-level administrator with all permissions',
            permissions: allPermissionIds,
            tenant: defaultTenant._id,
        });
        await Role.create({
            name: 'Admin',
            description: 'Tenant-level administrator with all permissions',
            permissions: allPermissionIds,
            tenant: defaultTenant._id,
        });

        // 2. Manager Role (Default Permissions)
        const managerPermissionKeys = [
            'dashboard:read',
            'user:read', 'user:update',
            'product:read',
            'order:create', 'order:read', 'order:update',
            'customer:create', 'customer:read', 'customer:update',
            'attendance:create', 'attendance:read'
        ];
        const managerPermissions = createdPermissions.filter(p => managerPermissionKeys.includes(p.key));
        await Role.create({
            name: 'Manager',
            description: 'Manages a department and its users',
            permissions: managerPermissions.map(p => p._id),
            tenant: defaultTenant._id,
        });

        // 3. Employee Role (Default Permissions)
        const employeePermissionKeys = [
            'dashboard:read',
            'product:read',
            'customer:read',
            'order:create', 'order:read',
            'attendance:create', 'attendance:read'
        ];
        const employeePermissions = createdPermissions.filter(p => employeePermissionKeys.includes(p.key));
        await Role.create({
            name: 'Employee',
            description: 'Basic user with limited access for daily tasks',
            permissions: employeePermissions.map(p => p._id),
            tenant: defaultTenant._id,
        });

        console.log('Default roles (Admin, Manager, Employee) with permissions created.');

        // Super Admin User Banayein
        await User.create({
            username: 'superadmin',
            email: 'wasiqzahoor1234@gmail.com', // Apni email istemal karein
            password: 'WasiQZah00RAdmiN', // Ek mazboot password rakhein
            roles: [superAdminRole._id],
            tenant: defaultTenant._id,
            status: 'active',
            isSuperAdmin: true
        });
        console.log('Super Admin user created.');

        console.log('\nData Imported Successfully!');
        
    } catch (error) {
        console.error('\nError with data import:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
        process.exit();
    }
};

runSeeder();