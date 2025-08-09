// server/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Import User model to fetch user if needed

// --- Authentication Middleware ---
const protect = async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer YOUR_TOKEN_HERE")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user data to request object (excluding password)
            // We fetch the user from DB to ensure they still exist and get the latest info
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- Authorization Middleware / Helper Function ---
// This function takes an array of allowed roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // req.user is set by the 'protect' middleware
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role (${req.user ? req.user.role : 'none'}) is not authorized to access this route` });
        }
        next(); // User has the required role, proceed
    };
};

module.exports = { protect, authorizeRoles };