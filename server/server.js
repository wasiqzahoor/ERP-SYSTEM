// server.js (no changes needed here from previous step)

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/Database.js'); // Import database connection
const authRoutes = require('./routes/authRoutes'); // This line remains the same
const userRoutes = require('./routes/userRoutes');



const app = express();
const PORT = process.env.PORT || 5000;

// --- Connect to Database ---
connectDB();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.get('/', (req, res) => {
    res.send('ERP Backend is running!');
});

app.use('/api/auth', authRoutes); // This line remains the same
app.use('/api/users', userRoutes); 




// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});