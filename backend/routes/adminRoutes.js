const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ride = require('../models/Ride');

// Get all drivers
router.get('/drivers', async (req, res) => {
    try {
        const drivers = await User.find({ role: 'DRIVER' });
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle driver suspension
router.put('/drivers/:id/suspend', async (req, res) => {
    try {
        const driver = await User.findById(req.params.id);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        
        driver.isActive = !driver.isActive;
        await driver.save();
        res.json(driver);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin-controlled driver registration
router.post('/register-driver', async (req, res) => {
    try {
        const adminAuth = require('firebase-admin').auth();
        const { email, password, name, phone, license, vehiclePlate } = req.body;

        // 1. Create purely via Backend Admin SDK (Client won't be logged out)
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name
        });

        // 2. Add custom claims for standard DB matching
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'DRIVER' });

        // 3. Save matching MongoDB document
        const newDriver = await User.create({
            firebaseUid: userRecord.uid,
            email: email,
            name: name,
            role: 'DRIVER',
            campusId: vehiclePlate, // repurposing campusId for vehiclePlate/license
            isActive: true
        });

        res.status(201).json(newDriver);
    } catch (err) {
        console.error("Admin Reg Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
    try {
        const totalRides = await Ride.countDocuments();
        const completedRides = await Ride.countDocuments({ status: 'COMPLETED' });
        const cancelledRides = await Ride.countDocuments({ status: 'CANCELLED' });
        
        // Aggregate rides per day for chart
        const ridesOverTime = await Ride.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totals: { totalRides, completedRides, cancelledRides },
            chartData: ridesOverTime.map(d => ({ date: d._id, rides: d.count }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
