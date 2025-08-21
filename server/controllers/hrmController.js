const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel'); // User model ko import karein
const csv = require('csv-parser'); 
const stream = require('stream');
const { Parser } = require('json2csv');

exports.uploadAttendanceCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const operations = []; // Hum bulk update ke liye operations yahan store karenge
    let processingErrors = []; // Errors ko yahan store karenge

    bufferStream
        .pipe(csv({ mapHeaders: ({ header }) => header.trim() })) // Headers se extra space hata dein
        .on('data', (row) => results.push(row))
        .on('end', async () => {
            try {
                // Pehle saare users ko ek hi baar mein fetch kar lein taake performance behtar ho
                const userEmails = results.map(r => r.email);
                const users = await User.find({ email: { $in: userEmails }, tenant: req.tenant._id }).select('_id email');
                const userMap = new Map(users.map(u => [u.email, u._id]));

                for (const row of results) {
                    const { email, date, status } = row;

                    if (!email || !date || !status) {
                        processingErrors.push(`Skipped row: Missing required fields (email, date, status) for email ${email || 'N/A'}`);
                        continue;
                    }

                    const userId = userMap.get(email);
                    if (!userId) {
                        processingErrors.push(`Skipped row: User with email "${email}" not found in this tenant.`);
                        continue;
                    }
                    
                    // Bulk write ke liye operation prepare karein
                    operations.push({
                        updateOne: {
                            filter: { user: userId, date: new Date(date), tenant: req.tenant._id },
                            update: { 
                                $set: { status, markedBy: req.user._id, tenant: req.tenant._id, user: userId, date: new Date(date) } 
                            },
                            upsert: true
                        }
                    });
                }
                
                // Saare operations ek saath database par chalayein
                if (operations.length > 0) {
                    await Attendance.bulkWrite(operations);
                }

                res.status(200).json({
                    message: 'CSV processed successfully.',
                    successCount: operations.length,
                    errorCount: processingErrors.length,
                    errors: processingErrors
                });

            } catch (error) {
                res.status(500).json({ message: 'Error processing CSV file.', error: error.message });
            }
        });
};

exports.markAttendance = async (req, res) => {
    const { date, status, userId } = req.body;
    
    // Request karne wala user (Admin/Manager/Employee)
    const requestingUser = await User.findById(req.user._id).populate('roles');
    // Jis user ki attendance mark ho rahi hai
    const targetUserId = userId || req.user._id;

    const userRoles = requestingUser.roles.map(r => r.name);
    const isAdmin = userRoles.includes('Admin');
    const isManager = userRoles.includes('Manager');

    try {
        const existingRecord = await Attendance.findOne({ user: targetUserId, date: new Date(date), tenant: req.tenant._id });
        if (existingRecord) {
            return res.status(400).json({ message: `Attendance for this user on ${date} has already been marked.` });
        }

        // --- NAYI, BEHTAR SECURITY LOGIC ---
        // Case 1: Employee apni 'Present' mark kar raha hai
        if (requestingUser._id.toString() === targetUserId.toString()) {
            if (status !== 'Present') {
                return res.status(403).json({ message: "You can only mark yourself as 'Present'." });
            }
        } 
        // Case 2: Manager/Admin kisi aur ki 'Leave' mark kar raha hai
        else if (isAdmin || isManager) {
            if (status !== 'Leave') {
                return res.status(403).json({ message: "You can only mark 'Leave' for other employees." });
            }
            // Manager sirf apne department ke user ki leave mark kar sakta hai
            if (isManager && !isAdmin) {
                const targetUser = await User.findById(targetUserId);
                if (requestingUser.department?.toString() !== targetUser.department?.toString()) {
                    return res.status(403).json({ message: "You can only mark leave for employees in your own department." });
                }
            }
        }
        // Case 3: Ijazat nahi hai
        else {
            return res.status(403).json({ message: "Forbidden: You do not have permission for this action." });
        }
        
        const attendance = await Attendance.create({
            user: targetUserId,
            date: new Date(date),
            status,
            markedBy: requestingUser._id,
            tenant: req.tenant._id
        });
        
        res.status(201).json(attendance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --- YEH FUNCTION BHI UPDATE HO GAYA HAI ---
exports.getAttendanceByDate = async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required." });

    try {
        const requestingUser = await User.findById(req.user._id).populate('roles');
        const userRoles = requestingUser.roles.map(r => r.name);
        const isAdmin = userRoles.includes('Admin');
        const isManager = userRoles.includes('Manager');

        let query = {
            tenant: req.tenant._id,
            date: { $gte: new Date(date), $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000) }
        };

        // Agar user Manager hai (lekin Admin nahi), to sirf uske department ke users ka data do
        if (isManager && !isAdmin) {
            const departmentUsers = await User.find({ department: requestingUser.department }).select('_id');
            const userIDs = departmentUsers.map(u => u._id);
            query.user = { $in: userIDs };
        }
        // Agar user na Admin hai na Manager, to usay kuch nahi milega is route se (sirf Admin/Manager ke liye)
        else if (!isAdmin && !isManager) {
             return res.status(200).json([]); // Khali array bhejein
        }
        
        const attendanceRecords = await Attendance.find(query).populate('user', 'username');
        res.status(200).json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching attendance.' });
    }
};


exports.getAttendanceForUser = async (req, res) => {
    try {
        const attendance = await Attendance.find({ user: req.params.userId });
        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.exportAttendance = async (req, res) => {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    try {
        const records = await Attendance.find({
            tenant: req.tenant._id,
            date: { $gte: startDate, $lte: endDate }
        })
        .populate('user', 'username')
        .sort({ date: 1, 'user.username': 1 })
        .lean();

        if (records.length === 0) {
            return res.status(404).json({ message: 'No records found.' });
        }
        
        const fields = ['date', 'user.username', 'status'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(records);

        res.header('Content-Type', 'text/csv');
        res.attachment(`attendance_${year}_${month}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};
exports.getMyAttendance = async (req, res) => {
    try {
        const records = await Attendance.find({
            user: req.user._id,
            tenant: req.tenant._id
        }).sort({ date: -1 });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};
exports.getMyAttendanceByDate = async (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: "Date parameter is required." });
    }

    try {
        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setUTCHours(23, 59, 59, 999);

        const attendanceRecord = await Attendance.findOne({
            tenant: req.tenant._id,
            user: req.user._id, // Sirf login kiye hue user ka record dhoondo
            date: { $gte: startDate, $lte: endDate }
        }).populate('user', 'username');

        // Frontend hamesha ek array expect karta hai, isliye result ko array mein bhejein
        res.status(200).json(attendanceRecord ? [attendanceRecord] : []);

    } catch (error) {
        console.error("Error fetching my attendance:", error);
        res.status(500).json({ message: "Server error fetching your attendance." });
    }
};