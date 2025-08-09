require('dotenv').config(); // This should be at the very top of your entry file!

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/Database.js'); // Import the database connection function

const app = express();
const PORT = process.env.PORT || 4003;

// --- Connect to Database ---
connectDB(); // Call the function to connect to MongoDB

// --- Middleware ---
// Enable CORS for all routes (adjust as needed for specific origins in production)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// --- Basic Route (for testing) ---
app.get('/', (req, res) => {
    res.send('ERP Backend is running!');
});

// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});