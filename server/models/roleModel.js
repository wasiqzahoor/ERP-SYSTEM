const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    
    name: { type: String, required: true, trim: true }, 
    
    description: { type: String, trim: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
}, { timestamps: true });

roleSchema.index({ tenant: 1, name: 1 }, { unique: true });

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;