// server/models/permissionModel.js
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    action: { type: String, required: true, trim: true },
    module: { type: String, required: true, trim: true },
    key: { type: String, unique: true, required: true }
});

// `pre('save')` hook hata diya gaya hai kyunke `insertMany` ke saath kaam nahi karta.
// Hum `key` ko `seeder.js` ya controller mein banayenge.

const Permission = mongoose.model('Permission', permissionSchema);
module.exports = Permission;