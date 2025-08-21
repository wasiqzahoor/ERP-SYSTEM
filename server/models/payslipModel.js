const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true }, // e.g., 8 for August
    year: { type: Number, required: true }, // e.g., 2025
    
    // Salary components
    basicSalary: { type: Number, default: 0 },
    totalAllowances: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    netSalary: { type: Number, required: true }, // Final amount to be paid

    // Details
    daysWorked: { type: Number },
    leaveDays: { type: Number },
    status: { type: String, enum: ['Generated', 'Paid', 'Cancelled'], default: 'Generated' },

    // Breakdown for the PDF
    allowancesBreakdown: [{ name: String, amount: Number }],
    deductionsBreakdown: [{ name: String, amount: Number }],

}, { timestamps: true });

// Ek user ki ek mahine/saal mein ek hi payslip ho sakti hai
payslipSchema.index({ tenant: 1, user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payslip', payslipSchema);