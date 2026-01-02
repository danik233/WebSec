// server/modules/file.model.js
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    originalName: {
        type: String,
        required: true
    },
    secureName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    userId: {
        type: String,
        required: false
    },
    userEmail: {
        type: String,
        required: false
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: String,
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    lastAccessedAt: {
        type: Date,
        default: null
    }
});

// Index for efficient queries
fileSchema.index({ userId: 1, uploadedAt: -1 });
fileSchema.index({ fileId: 1 });

module.exports = mongoose.model("File", fileSchema);