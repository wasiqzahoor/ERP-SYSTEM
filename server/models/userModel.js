// server/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
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
    role: {
        type: String,
        enum: ['admin', 'manager', 'employee'], // Define possible roles
        default: 'employee', // Default role for new users
    },
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

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