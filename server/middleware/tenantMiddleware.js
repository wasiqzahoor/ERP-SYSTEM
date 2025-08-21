const mongoose = require('mongoose'); // Mongoose ko import karna zaroori hai
const Tenant = require('../models/tenantModel');

const resolveTenant = async (req, res, next) => {
    // Profile route ko header check se exempt karein (jaisa pehle tha)
    if (req.path.startsWith('/profile')) {
        return next();
    }
    
    // Agar Super Admin hai to tenant ki zaroorat nahi
    if (req.user && req.user.isSuperAdmin) {
        return next();
    }

    const tenantIdentifier = req.headers['x-tenant-id'];

    if (!tenantIdentifier) {
        return res.status(400).json({ message: 'Tenant identifier header (x-tenant-id) is missing.' });
    }
    
    try {
        let query;

        // --- YEH HAI ASAL CHANGE ---
        // Pehle check karein ke identifier ek valid ObjectId hai ya nahi
        if (mongoose.Types.ObjectId.isValid(tenantIdentifier)) {
            // Agar valid hai, to _id aur subdomain dono se dhoondo
            query = { 
                $or: [{ _id: tenantIdentifier }, { subdomain: tenantIdentifier }] 
            };
        } else {
            // Agar valid ObjectId nahi hai, to YAQEENAN yeh ek subdomain hai.
            // Sirf subdomain se dhoondo.
            query = { subdomain: tenantIdentifier };
        }

        const tenant = await Tenant.findOne(query);

        if (!tenant) {
            return res.status(404).json({ message: `The specified tenant was not found.` });
        }
        
        req.tenant = tenant;
        next();
    } catch (error) {
        console.error("Error in resolveTenant middleware:", error);
        res.status(500).json({ message: 'Server error while resolving tenant.' });
    }
};

module.exports = { resolveTenant };