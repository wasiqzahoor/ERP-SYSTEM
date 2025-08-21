// server/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Salary aur bank details ke liye ek naya sub-schema banayein
const salaryStructureSchema = new mongoose.Schema({
    basicSalary: { type: Number, default: 0 },
     allowances: [{ 
        name: String, // e.g., "Bonus", "Travel Allowance"
        amount: Number 
    }],
    // ... (yahan aap doosri cheezein jaise 'provident fund', 'tax' etc. add kar sakte hain)
});

const bankDetailsSchema = new mongoose.Schema({
    bankName: String,
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
});
// Sub-schemas for complex fields
const educationSchema = new mongoose.Schema({
    degree: String,
    institution: String,
    year: String,
});

const experienceSchema = new mongoose.Schema({
    title: String,
    company: String,
    years: String,
});

const userSchema = new mongoose.Schema({

    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
     isSuperAdmin: { // <-- YEH FIELD ADD KAREIN
        type: Boolean,
        default: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6, // Minimum password length
    },
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role', // Ab hum 'Role' model ko refer karenge
        required: true,
    }],
    status: { 
        type: String,
        enum: ['unverified', 'pending', 'active', 'inactive', 'terminated'], // Possible statuses
        default: 'unverified', // New users start as 'pending'
        required: true,
    },
     verificationCode: {
        type: String,
        default: null,
    },
    verificationCodeExpires: {
        type: Date,
        default: null,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null,
    },
     salaryStructure: {
        type: salaryStructureSchema,
         default: () => ({ basicSalary: 0, allowances: [] }) // Default ek khali object hoga
    },
    bankDetails: {
        type: bankDetailsSchema,
        default: () => ({})
    },
    permissionOverrides: { // User-specific permissions
        type: [{
            permission: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission' },
            hasAccess: { type: Boolean } // true for grant, false for revoke
        }],
        default: []
    },
// --- New Profile Fields ---
    avatar: { type: String, default: '' }, // URL to the image
    bio: { type: String, default: '', maxlength: 250 },
    address: { type: String, default: '' },
    skills: { type: [String], default: [] }, // Array of strings for skills
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
     twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },

}, { timestamps: true });

userSchema.methods.getVerificationCode = function() {
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // We don't need to hash a simple 6-digit code for this use case,
    // but for higher security (like password resets), hashing is a must.
    this.verificationCode = code;

    // Set expiration to 10 minutes from now
    this.verificationCodeExpires = Date.now() + 10 * 60 * 1000; 
    
    return code;
};
userSchema.index({ tenant: 1, email: 1 }, { unique: true });
userSchema.index({ tenant: 1, username: 1 }, { unique: true });
// --- Middleware to hash password before saving ---
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// --- Method to compare entered password with hashed password ---
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;