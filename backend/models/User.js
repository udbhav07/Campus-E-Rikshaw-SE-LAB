const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['PASSENGER', 'DRIVER', 'ADMIN'],
        default: 'PASSENGER',
    },
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
    },
    campusId: {
        type: String, // e.g. student roll number
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);
