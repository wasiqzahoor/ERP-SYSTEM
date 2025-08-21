// server/middleware/auditMiddleware.js
const AuditLog = require('../models/auditLogModel');

const logAction = (module) => {
    return async (req, res, next) => {
        // Pehle original route handler ko chalne dein
        next();

        // Jab response wapis ja raha ho, tab log karein
        res.on('finish', async () => {
            // Sirf kamiyab actions (2xx status codes) ko log karein
            if (res.statusCode >= 200 && res.statusCode < 300) {
                let action = '';
                if (req.method === 'POST') action = 'Created';
                if (req.method === 'PUT') action = 'Updated';
                if (req.method === 'DELETE') action = 'Deleted';

                if (action) {
                    try { // Best practice: Logging fail hone par server crash na ho
                        await AuditLog.create({
                            user: req.user._id,
                            tenant: req.tenant._id, // <--- YEH LINE ADD KARNI HAI
                            action,
                            module,
                            details: `Performed an action on ${req.originalUrl}`,
                            ipAddress: req.clientIp
                        });
                    } catch (logError) {
                        console.error("Failed to write to audit log:", logError);
                    }
                }
            }
        });
    };
};

module.exports = { logAction };