// server/controllers/reportController.js
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const PDFDocument = require('pdfkit');
const Permission = require('../models/permissionModel');
const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');
const Role = require('../models/roleModel');

exports.generateSalesReport = async (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).json({ message: "Month and year are required." });
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    try {
        // Us mahine ki pehli aur aakhri tareekh nikalein
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        // Database se us date range ke saare 'Paid' aur 'Shipped' orders fetch karein
        const orders = await Order.find({
            tenant: req.tenant._id,
            status: { $in: ['Paid', 'Shipped'] },
            createdAt: { $gte: startDate, $lte: endDate }
        }).populate('customer', 'name').sort({ createdAt: 1 });

        // --- Data ko Calculate Karein ---
        const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;

        // Best selling products nikalne ke liye
        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
            });
        });

        // Top 5 products nikal lein
        const topProducts = Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        // --- PDF Banana Shuru Karein ---
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${yearNum}-${monthNum}.pdf`);
        doc.pipe(res);

        // --- PDF Content ---
        // Header
        doc.fontSize(20).font('Helvetica-Bold').text(`Monthly Sales Report`, { align: 'center' });
        doc.fontSize(14).font('Helvetica').text(`${startDate.toLocaleString('default', { month: 'long' })} ${yearNum}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(16).font('Helvetica-Bold').text('Summary');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text(`Total Sales:`, { continued: true }).font('Helvetica').text(` $${totalSales.toFixed(2)}`);
        doc.font('Helvetica-Bold').text(`Total Orders:`, { continued: true }).font('Helvetica').text(` ${totalOrders}`);
        doc.moveDown(2);

        // Top Products Section
        doc.fontSize(16).font('Helvetica-Bold').text('Top 5 Selling Products');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        if (topProducts.length > 0) {
            topProducts.forEach(([name, quantity]) => {
                doc.fontSize(12).text(`- ${name} (Sold: ${quantity})`);
            });
        } else {
            doc.fontSize(12).text('No product sales data available for this period.');
        }
        doc.moveDown(2);

        // Footer
        doc.fontSize(10).text(`Report Generated on: ${new Date().toLocaleDateString()}`, 50, 750, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error("Error generating sales report:", error);
        res.status(500).json({ message: 'Server error while generating report.' });
    }
};
exports.getSalesReportData = async (req, res) => {
    const { month, year } = req.query;
    if (!month || !year) {
        return res.status(400).json({ message: "Month and year are required." });
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    try {
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        const orders = await Order.find({
            tenant: req.tenant._id,
            status: { $in: ['Paid', 'Shipped'] },
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Data ko calculate karein
        const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Response mein JSON data bhejein
        res.status(200).json({
            totalSales: totalSales.toFixed(2),
            totalOrders,
            averageOrderValue: averageOrderValue.toFixed(2),
            period: `${startDate.toLocaleString('default', { month: 'long' })} ${yearNum}`
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching report data.' });
    }
};
exports.getInventoryReportData = async (req, res) => {
    try {
        const [totalProducts, lowStockCount, stockValueAggregation] = await Promise.all([
            Product.countDocuments({ tenant: req.tenant._id }),
            Product.countDocuments({
                tenant: req.tenant._id,
                $expr: { $lte: ['$stock', '$lowStockThreshold'] } 
            }),
            Product.aggregate([
                { $match: { tenant: req.tenant._id } },
                { $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
                }}
            ])
        ]);

        const totalStockValue = stockValueAggregation[0] ? stockValueAggregation[0].totalValue : 0;

        res.status(200).json({
            totalProducts,
            lowStockCount,
            totalStockValue: totalStockValue.toFixed(2)
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error fetching inventory data.' });
    }
};
exports.getAttendanceReportData = async (req, res) => {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: "Month and year are required." });
    
    const monthNum = parseInt(month, 10), yearNum = parseInt(year, 10);
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    try {
        const [totalEmployees, presentRecords, absentRecords, leaveRecords] = await Promise.all([
            User.countDocuments({ tenant: req.tenant._id, status: 'active' }),
            Attendance.countDocuments({ tenant: req.tenant._id, date: { $gte: startDate, $lte: endDate }, status: 'Present' }),
            Attendance.countDocuments({ tenant: req.tenant._id, date: { $gte: startDate, $lte: endDate }, status: 'Absent' }),
            Attendance.countDocuments({ tenant: req.tenant._id, date: { $gte: startDate, $lte: endDate }, status: 'Leave' })
        ]);

        res.status(200).json({
            totalEmployees,
            presentRecords,
            absentRecords,
            leaveRecords,
            period: `${startDate.toLocaleString('default', { month: 'long' })} ${yearNum}`
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error fetching attendance data.' });
    }
};
exports.getUserPermissionsReportData = async (req, res) => {
    try {
        const users = await User.find({ tenant: req.tenant._id, isSuperAdmin: false })
            .populate({
                path: 'roles',
                select: 'name permissions'
            })
            .populate('permissionOverrides.permission', 'key')
            .select('username email roles permissionOverrides')
            .lean();

        const allRoleIds = users.flatMap(u => u.roles.map(r => r._id));
        const rolesWithPermissions = await Role.find({ _id: { $in: allRoleIds } })
            .populate('permissions', 'key')
            .lean();

        const rolePermissionsMap = rolesWithPermissions.reduce((map, role) => {
            map[role._id] = role.permissions.map(p => p.key);
            return map;
        }, {});

        const reportData = users.map(user => {
            const effectivePermissions = new Set();
            user.roles.forEach(role => {
                const permissionsForRole = rolePermissionsMap[role._id] || [];
                permissionsForRole.forEach(pKey => effectivePermissions.add(pKey));
            });
            
            user.permissionOverrides.forEach(override => {
                if (override.permission && override.permission.key) {
                    if (override.hasAccess) {
                        effectivePermissions.add(override.permission.key);
                    } else {
                        effectivePermissions.delete(override.permission.key);
                    }
                }
            });

            return {
                _id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles.map(r => r.name).join(', '),
                permissions: Array.from(effectivePermissions).sort()
            };
        });

        res.status(200).json(reportData);
    } catch (error) {
        console.error("Error generating user permissions report:", error);
        res.status(500).json({ message: 'Server error while generating report.' });
    }
};

