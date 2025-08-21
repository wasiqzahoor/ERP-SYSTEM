// server/models/attendanceModel.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Leave'], required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ek tenant mein, ek user ki ek din mein ek hi entry ho sakti hai
attendanceSchema.index({ tenant: 1, user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;