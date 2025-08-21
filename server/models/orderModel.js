// server/models/orderModel.js

const mongoose = require('mongoose');

// --- IS SCHEMA KO UPDATE KAREIN ---
const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // <-- YEH LINE ADD KAREIN
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true } // Price at the time of order
});

const orderSchema = new mongoose.Schema({
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    orderId: { type: String, required: true }, // unique: true baad mein aahista se add karein
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [orderItemSchema], // Ab yeh naya schema istemal karega
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Shipped', 'Cancelled', 'Overdue'], default: 'Pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ek tenant ke andar orderId unique hona chahiye
orderSchema.index({ tenant: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);