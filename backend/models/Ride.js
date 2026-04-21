const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
    passengerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    pickupLocation: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    dropLocation: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    status: {
        type: String,
        enum: ['REQUESTED', 'ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
        default: 'REQUESTED',
    },
    fare: {
        type: Number,
    },
    rating: {
        type: Number,
    },
    feedback: {
        type: String,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Ride', RideSchema);
