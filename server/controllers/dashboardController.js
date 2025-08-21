// server/controllers/dashboardController.js
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

// @desc    Get all key statistics and data for the dashboard
// @route   GET /api/dashboard/stats
// @access  Private (Admin/Manager)
exports.getDashboardStats = async (req, res) => {
    try {
        const tenantId = req.tenant._id;

        // Saari zaroori queries ko ek saath (concurrently) chalayein
        const [
            // General Stats
            totalProducts, 
            totalUsers, 
            pendingOrders, 
            salesData, 
            pendingUserCount,

            // Chart Data
            salesLast7Days,
            productCategories,

            // List Data
            recentOrders, 
            lowStockItems,
            
            // Top Performers Data
            topProductResult,
            topCustomerResult

        ] = await Promise.all([
            // --- General Stats ---
            Product.countDocuments({ tenant: tenantId }),
            User.countDocuments({ tenant: tenantId, status: 'active' }),
            Order.countDocuments({ tenant: tenantId, status: 'Pending' }),
            Order.aggregate([
                { $match: { tenant: tenantId, status: { $in: ['Paid', 'Shipped'] } } },
                { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
            ]),
            User.countDocuments({ tenant: tenantId, status: 'pending' }),

            // --- Chart Data ---
            Order.aggregate([
                { $match: { 
                    tenant: tenantId,
                    status: { $in: ['Paid', 'Shipped'] },
                    createdAt: { $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) }
                }},
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: '$totalAmount' }
                }},
                { $sort: { _id: 1 } }
            ]),
            Product.aggregate([
                { $match: { tenant: tenantId } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // --- List Data ---
            Order.find({ tenant: tenantId }).sort({ createdAt: -1 }).limit(5).populate('customer', 'name'),
            Product.find({ 
                tenant: tenantId,
                $expr: { $lte: ['$stock', '$lowStockThreshold'] } 
            }).sort({ stock: 1 }).limit(5),

            // --- Top Performers Data ---
            Order.aggregate([
                { $match: { tenant: tenantId } }, { $unwind: '$items' },
                { $group: { _id: '$items.name', totalQuantity: { $sum: '$items.quantity' } } },
                { $sort: { totalQuantity: -1 } }, { $limit: 1 }
            ]),
            Order.aggregate([
                { $match: { tenant: tenantId } },
                { $group: { _id: '$customer', totalSpent: { $sum: '$totalAmount' } } },
                { $sort: { totalSpent: -1 } }, { $limit: 1 },
                { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customerDetails' } },
                { $unwind: '$customerDetails' }
            ])
        ]);

        const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

        res.status(200).json({
            // General Stats
            totalProducts, totalUsers, pendingOrders, totalSales,
            pendingUserCount,
            // Chart Data
            salesLast7Days,
            productCategories,
            // List Data
            recentOrders,
            lowStockItems,
            // Top Performers Data
            topSellingProduct: topProductResult[0] ? topProductResult[0]._id : 'N/A',
            topCustomer: topCustomerResult[0] ? topCustomerResult[0].customerDetails.name : 'N/A'
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: 'Server error fetching dashboard stats.' });
    }
};