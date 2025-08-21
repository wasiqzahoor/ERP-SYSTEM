// server/models/departmentModel.js

const mongoose = require('mongoose'); // <-- Yahan 'require' add kiya gaya hai

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    // Har department ek tenant ke andar hoga
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    }
}, { timestamps: true });

// Ek tenant mein department ka naam unique hona chahiye
departmentSchema.index({ tenant: 1, name: 1 }, { unique: true });

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;