const mongoose = require('mongoose');

// Load environment variables (ensure .env is loaded before this file)
require('dotenv').config({ path: '../.env' }); // Adjust path as needed, assuming .env is in server/

const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            console.error('Error: MONGODB_URI not found in environment variables.');
            process.exit(1); // Exit process with failure
        }

        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully!');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;