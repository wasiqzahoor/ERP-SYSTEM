// server.js

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const connectDB = require('./config/Database.js');
const requestIp = require('request-ip');

// --- Express app banayein ---
const app = express();

// --- Express app se HTTP server banayein ---
const server = http.createServer(app);

// --- Socket.io ko HTTP server ke saath jorein ---
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://erp-system-dusky.vercel.app"], // Aapke frontend ka address
        methods: ["GET", "POST", "PATCH", "DELETE", "PUT"] // Tamam zaroori methods shamil karein
    }
});

// --- Database se jorein ---
connectDB();

// --- Sabhi Models ko load karein ---
require('./models/tenantModel');
require('./models/permissionModel');
require('./models/roleModel');
require('./models/departmentModel');
require('./models/userModel');
require('./models/productModel');
require('./models/customerModel');
require('./models/orderModel');
require('./models/attendanceModel');
require('./models/auditLogModel');
require('./models/notificationModel');

// --- Middleware setup karein ---
app.use(cors());
app.use(express.json());
app.use(requestIp.mw());

// --- Socket.io ko har request ke liye available karein ---
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- Authentication aur Tenant Middleware files ko load karein ---
const { protect } = require('./middleware/authMiddleware');
const { resolveTenant } = require('./middleware/tenantMiddleware');

// --- Routes files ko load karein ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const roleRoutes = require('./routes/roleRoutes');
const productRoutes = require('./routes/productRoutes');
const hrmRoutes = require('./routes/hrmRoutes');
const salesRoutes = require('./routes/salesRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
// --- Routes ko use karein (Sahi tarteeb ke saath) ---

// Public Routes: Inhein kisi protection ya tenant context ki zaroorat nahi.
app.get('/', (req, res) => {
    res.send('ERP Backend is running!');
});
app.use('/api/auth', authRoutes);
// Super Admin Routes: Inhein sirf 'protect' ki zaroorat hai, 'resolveTenant' ki nahi.
// Is tarah, in routes par x-tenant-id header check nahi hoga.
app.use('/api/superadmin', protect, superAdminRoutes);

// Tenant-Specific Routes: Inhein 'protect' aur 'resolveTenant' dono ki zaroorat hai.
// Order aham hai: pehle protect (user verify), phir resolveTenant (tenant verify).
app.use('/api/users', protect, resolveTenant, userRoutes);
app.use('/api/permissions', protect, resolveTenant, permissionRoutes);
app.use('/api/roles', protect, resolveTenant, roleRoutes);
app.use('/api/products', protect, resolveTenant, productRoutes);
app.use('/api/hrm', protect, resolveTenant, hrmRoutes);
app.use('/api/sales', protect, resolveTenant, salesRoutes);
app.use('/api/notifications', protect, resolveTenant, notificationRoutes);
app.use('/api/departments', protect, resolveTenant, departmentRoutes);
app.use('/api/dashboard', protect, resolveTenant, dashboardRoutes);
app.use('/api/customers', protect, resolveTenant, customerRoutes);
app.use('/api/logs', protect, resolveTenant, auditLogRoutes); 
app.use('/api/reports', protect, resolveTenant, reportRoutes);
app.use('/api/payroll', payrollRoutes);

// --- Socket.io connection logic ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Super Admin room
    socket.on('join_super_admin_room', () => {
        socket.join('super_admin');
        console.log(`User ${socket.id} joined global room 'super_admin'`);
    });

    // Tenant-specific room
    socket.on('join_tenant_room', (tenantId) => {
        socket.join(tenantId);
        console.log(`User ${socket.id} joined room ${tenantId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// --- Server ko start karein ---
const PORT = process.env.PORT || 4002;
server.listen(PORT, () => {
    console.log(`Server with Socket.io is running on port ${PORT}`);
});
