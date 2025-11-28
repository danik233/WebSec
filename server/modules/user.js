// modules/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    paid: { type: Boolean, default: false },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" }, // Role of the user
    favArray: {
        type: Array,
        default: [],
    },
    signupDate: {
        type: Date,
        default: Date.now,
    },
    failedAttempts: {      // Number of consecutive failed login attempts
        type: Number,
        default: 0
    },
    lockUntil: {           // Timestamp until which account is locked
        type: Date,
        default: null
    }
});

module.exports = mongoose.model("User", userSchema);
