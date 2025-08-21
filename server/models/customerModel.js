// server/models/customerModel.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ek tenant mein email unique ho sakta hai (agar zaroori ho)
customerSchema.index({ tenant: 1, email: 1 }, { unique: true, sparse: true }); // sparse:true allows multiple null emails

module.exports = mongoose.model('Customer', customerSchema);