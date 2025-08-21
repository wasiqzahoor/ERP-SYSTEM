// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Tenant = require('../models/tenantModel'); // **IMPORTANT: Tenant model import kariye**
const Role = require('../models/roleModel');
const Permission = require('../models/permissionModel');

// `protect` middleware - JWT verify aur user/tenant set karta hai
const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // User ko fetch kariye with tenant populate
            const user = await User.findById(decoded.id)
                .populate('tenant') // **CRITICAL: Tenant populate kariye**
                .select('-password');
                
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // **CRITICAL FIX: Tenant set kariye req me**
            if (user.tenant) {
                req.tenant = user.tenant; // Tenant object set kariye
                console.log('Tenant set successfully:', user.tenant._id);
            } else {
                console.log('User has no tenant assigned:', user._id);
                return res.status(400).json({ message: 'User has no tenant assigned' });
            }

            req.user = user;
            next();
            
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Permission checking middleware
const checkPermission = (requiredPermissionKey) => {
    return async (req, res, next) => {
        try {
            // **FIX: req.user.id instead of req.user._id use kariye**
            const userId = req.user._id || req.user.id;
            
            const user = await User.findById(userId).populate({
                path: 'roles',
                populate: { path: 'permissions' }
            }).populate('permissionOverrides.permission');
            
            if (!user) {
                return res.status(401).json({ message: 'Not authorized.' });
            }

            // Super admin check (if you have this field)
            if (user.isSuperAdmin) {
                return next();
            }

            // 1. Check user-specific overrides first
            const override = user.permissionOverrides.find(o => 
                o.permission && o.permission.key === requiredPermissionKey
            );
            
            if (override) {
                if (override.hasAccess) {
                    return next(); // Override granted access
                } else {
                    return res.status(403).json({ 
                        message: `Forbidden: Your access to this resource (${requiredPermissionKey}) has been specifically revoked.` 
                    });
                }
            }

            // 2. Check role permissions if no override
            let userPermissions = new Set();
            
            if (user.roles && user.roles.length > 0) {
                user.roles.forEach(role => {
                    if (role.permissions && role.permissions.length > 0) {
                        role.permissions.forEach(p => {
                            if (p && p.key) {
                                userPermissions.add(p.key);
                            }
                        });
                    }
                });
            }

            if (userPermissions.has(requiredPermissionKey)) {
                next(); // Role granted access
            } else {
                return res.status(403).json({ 
                    message: `Forbidden: You do not have the required permission (${requiredPermissionKey}).` 
                });
            }

        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Server error during permission check.' });
        }
    };
};

const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.isSuperAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Super Admin access required.' });
    }
};

module.exports = { protect, checkPermission, isSuperAdmin };