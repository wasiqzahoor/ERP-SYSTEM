// server/models/tenantModel.js
const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: { // Company ka naam
        type: String,
        required: true,
        unique: true
    },
    subdomain: { // e.g., 'acme' for acme.erp.com
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
     status: { // <-- YEH NAYI FIELD ADD KAREIN
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    // ... (other tenant-specific info like subscription plan, etc.)
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);
module.exports = Tenant;