const User = require('../models/userModel');
const Payslip = require('../models/payslipModel');
const Attendance = require('../models/attendanceModel');
const Tenant = require('../models/tenantModel');
const mongoose = require('mongoose');

// @desc    Generate payslips for a specific month and year
// @route   POST /api/payroll/generate
exports.generatePayslips = async (req, res) => {
    const { month, year } = req.body;
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (!monthNum || !yearNum || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "Valid month and year are required." });
    }

    try {
        const tenantId = req.tenant._id;
        const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
        const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59));

        const [users, allAttendance] = await Promise.all([
            User.find({ tenant: tenantId, status: 'active' }).lean(),
            Attendance.find({
                tenant: tenantId,
                date: { $gte: startDate, $lte: endDate }
            }).populate('user', '_id').lean()
        ]);

        const attendanceByUser = allAttendance.reduce((acc, record) => {
            if (record.user && record.user._id) {
                const userId = record.user._id.toString();
                if (!acc[userId]) acc[userId] = [];
                acc[userId].push(record);
            }
            return acc;
        }, {});

        const payslipOperations = [];
        
        for (const user of users) {
            const userAttendance = attendanceByUser[user._id.toString()] || [];
            
            const totalDaysInMonth = endDate.getUTCDate();
            const leaveDays = userAttendance.filter(a => a.status === 'Leave' || a.status === 'Absent').length;
            const daysWorked = Math.max(0, totalDaysInMonth - leaveDays);
            
            const basicSalary = user.salaryStructure?.basicSalary || 0;
            if (basicSalary === 0) continue;

            const leaveDeduction = (basicSalary / totalDaysInMonth) * leaveDays;
            
            // --- YEH NAYI AUR AHEM LOGIC HAI ---
            // User ke saare allowances (jismein bonus bhi hai) ko jama karein
            const allowancesFromProfile = user.salaryStructure?.allowances || [];
            const totalAllowances = allowancesFromProfile.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            
            // Khaas tor par "Bonus" ko alag se nikal lein takay table mein dikha sakein
            const bonusItem = allowancesFromProfile.find(a => a.name.toLowerCase().includes('bonus'));
            const bonusAmount = bonusItem ? (parseFloat(bonusItem.amount) || 0) : 0;
            // --- LOGIC KHATAM ---

            const deductionsBreakdown = [{
                name: 'Leave/Absent Deduction',
                amount: parseFloat(leaveDeduction.toFixed(2))
            }];
            const totalDeductions = parseFloat(leaveDeduction.toFixed(2));

            const netSalary = (basicSalary + totalAllowances) - totalDeductions;
            
            const payslipData = {
                tenant: tenantId, user: user._id, month: monthNum, year: yearNum,
                basicSalary: parseFloat(basicSalary.toFixed(2)),
                totalAllowances: parseFloat(totalAllowances.toFixed(2)),
                totalDeductions,
                bonus: parseFloat(bonusAmount.toFixed(2)), // Bonus ki value yahan set karein
                netSalary: parseFloat(netSalary.toFixed(2)),
                daysWorked, leaveDays,
                allowancesBreakdown: allowancesFromProfile, // Poori list save karein
                deductionsBreakdown,
            };

            payslipOperations.push({
                updateOne: {
                    filter: { tenant: tenantId, user: user._id, month: monthNum, year: yearNum },
                    update: { $set: payslipData },
                    upsert: true
                }
            });
        }

        if (payslipOperations.length > 0) {
            await Payslip.bulkWrite(payslipOperations);
        }

        res.status(200).json({ 
            message: `${payslipOperations.length} payslips were generated/updated successfully.`,
            count: payslipOperations.length
        });

    } catch (error) {
        console.error("Error generating payslips:", error);
        res.status(500).json({ message: 'Server error while generating payslips.' });
    }
};

// @desc    Get all payslips for a specific month and year
// @route   GET /api/payroll?month=M&year=YYYY
exports.getPayslips = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year query parameters are required.' });
        }

        // Validate input
        const monthNumber = parseInt(month, 10);
        const yearNumber = parseInt(year, 10);

        if (isNaN(monthNumber) || isNaN(yearNumber) || monthNumber < 1 || monthNumber > 12) {
            return res.status(400).json({ message: 'Invalid month or year format.' });
        }

        // **CRITICAL FIX: Get tenant ID from user if not in req.tenant**
        let tenantId;
        if (req.tenant && req.tenant._id) {
            tenantId = req.tenant._id;
        } else if (req.user && req.user.tenant) {
            tenantId = req.user.tenant;
            console.log('Using tenant ID from user:', tenantId);
        } else {
            console.log('No tenant found in request or user');
            return res.status(400).json({ message: "Tenant information is missing." });
        }

        console.log(`Fetching payslips for tenant: ${tenantId}, month: ${monthNumber}, year: ${yearNumber}`);

        const payslips = await Payslip.find({
            tenant: new mongoose.Types.ObjectId(tenantId),
            month: monthNumber,
            year: yearNumber
        })
        .populate('user', 'username email')
        .sort({ 'user.username': 1 })
        .lean();

        console.log(`Found ${payslips.length} payslips`);

        // Format response data (optional, but good practice)
        const formattedPayslips = payslips.map(slip => ({
            ...slip,
            _id: slip._id.toString(),
            tenant: slip.tenant.toString(),
            user: slip.user ? {
                ...slip.user,
                _id: slip.user._id.toString()
            } : null
        }));

        res.status(200).json(formattedPayslips);

    } catch (error) {
        console.error("Error fetching payslips:", error);
        res.status(500).json({ 
            message: 'Server error fetching payslips.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};