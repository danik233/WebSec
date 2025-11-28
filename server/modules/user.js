// modules/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    paid: { type: Boolean, default: false },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" }, // new field for role
    favArray: {
        type: Array,
        default: [],
    },
    signupDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", userSchema);
