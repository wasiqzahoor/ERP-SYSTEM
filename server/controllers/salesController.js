// server/controllers/salesController.js

const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const PDFDocument = require('pdfkit');
const User = require('../models/userModel');
const mongoose = require('mongoose'); // <-- Mongoose ko import karna zaroori hai

// @desc    Create a new order (WITH TRANSACTION)
// @route   POST /api/sales/orders
// @access  Private
exports.createOrder = async (req, res) => {
    const { customerId, items } = req.body;

    if (!customerId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Customer ID and items are required.' });
    }

    // --- TRANSACTION SHURU ---
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let totalAmount = 0;
        const orderItems = [];
        const productUpdates = []; // Stock updates ko yahan store karein

        for (const item of items) {
            // Hum product ko session ke andar find karein gey takay data consistent rahe
            const product = await Product.findById(item.productId).session(session);
            
            if (!product) {
                // Agar product nahi mila, to foran transaction abort karein
                throw new Error(`Product with ID ${item.productId} not found.`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
            }

            const itemPrice = product.price * item.quantity;
            totalAmount += itemPrice;
            
            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
            
            // Stock update ko prepare karein, abhi save nahi karein
            product.stock -= item.quantity;
            productUpdates.push(product.save({ session })); // Session ke saath save prepare karein
        }

        const orderCount = await Order.countDocuments({ tenant: req.tenant._id }).session(session);
        const orderId = `ORD-${req.tenant.subdomain.toUpperCase()}-${orderCount + 1}`;

        const newOrder = new Order({
            orderId,
            customer: customerId,
            items: orderItems,
            totalAmount,
            tenant: req.tenant._id,
            createdBy: req.user._id,
        });

        // Naye order ko session ke saath save karein
        await newOrder.save({ session });

        // Saare product stock updates ko ek saath save karein
        await Promise.all(productUpdates);
        
        // --- Agar sab kuch theek raha, to transaction ko FINAL karein ---
        await session.commitTransaction();
        session.endSession();

        res.status(201).json(newOrder);

    } catch (error) {
        // --- Agar koi bhi error aaya, to transaction ko ROLLBACK karein ---
        await session.abortTransaction();
        session.endSession();
        
        // User ko aasan error message bhejein
        console.error("Order creation failed, transaction aborted:", error.message);
        res.status(500).json({ message: 'Server error while creating order.', error: error.message });
    }
};


// --- GET ALL ORDERS (wesa hi rahega) ---
exports.getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Har page par 10 orders
        const skip = (page - 1) * limit;

        let query = { tenant: req.tenant._id };
        const userRoles = req.user.roles.map(r => r.name);
        const isManager = userRoles.includes('Manager') && !userRoles.includes('Admin');

        if (isManager && req.user.department) {
            const departmentUsers = await User.find({ department: req.user.department, tenant: req.tenant._id }).select('_id');
            const userIDsInDepartment = departmentUsers.map(u => u._id);
            query.createdBy = { $in: userIDsInDepartment };
        }

        const [orders, totalOrders] = await Promise.all([
            Order.find(query)
                .populate('customer', 'name')
                .populate('createdBy', 'username')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip),
            Order.countDocuments(query)
        ]);
        
        const totalPages = Math.ceil(totalOrders / limit);

        res.status(200).json({
            orders,
            currentPage: page,
            totalPages,
            totalOrders
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error fetching orders.' });
    }
};

exports.generateInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('customer', 'name email address')
            .populate('tenant', 'name');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if(order.tenant._id.toString() !== req.tenant._id.toString()){
            return res.status(403).json({ message: 'Forbidden' });
        }

        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text(`Invoice from ${order.tenant.name}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice #: ${order.orderId}`);
        doc.text(`Date: ${order.createdAt.toLocaleDateString()}`);
        doc.text(`Status: ${order.status}`);
        doc.moveDown();
        doc.text('Bill To:');
        doc.text(order.customer.name);
        doc.text(order.customer.address || 'N/A');
        doc.moveDown(2);

        doc.font('Helvetica-Bold').text('Item', 50, 250)
           .text('Quantity', 250, 250)
           .text('Unit Price', 350, 250, { width: 100, align: 'right' })
           .text('Total', 450, 250, { width: 100, align: 'right' });
        doc.moveTo(50, 270).lineTo(550, 270).stroke();

        let y = 280;
        doc.font('Helvetica');
        order.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            doc.text(item.name, 50, y)
               .text(item.quantity.toString(), 250, y)
               .text(`$${item.price.toFixed(2)}`, 350, y, { width: 100, align: 'right' })
               .text(`$${itemTotal.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
            y += 20;
        });
        doc.moveTo(50, y).lineTo(550, y).stroke();
        
        doc.font('Helvetica-Bold').text('Total:', 350, y + 20, { width: 100, align: 'right' })
            .text(`$${order.totalAmount.toFixed(2)}`, 450, y + 20, { width: 100, align: 'right' });

        doc.end();

    } catch (error) {
        console.error('Invoice generation error:', error);
        res.status(500).json({ message: 'Server error generating invoice.' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body; // Naya status request body se lein
        const { orderId } = req.params; // Order ki ID URL se lein

        // Pehle order ko find karein
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Security Check: Kya yeh order isi company (tenant) ka hai?
        if (order.tenant.toString() !== req.tenant._id.toString()) {
            return res.status(403).json({ message: 'Forbidden: You cannot access this order.' });
        }

        // Status update karein
        order.status = status;
        
        // Update kiye hue order ko save karein
        const updatedOrder = await order.save();

        res.status(200).json(updatedOrder);

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: 'Server error while updating status.' });
    }
};