const User = require('../models/User');
const Ride = require('../models/Ride');
const adminAuth = require('firebase-admin').auth();

/**
 * Retrieves all registered drivers.
 */
const getAllDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ role: 'DRIVER' });
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Toggles the active/suspended status of a specific driver.
 */
const toggleDriverSuspension = async (req, res) => {
    try {
        const driver = await User.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        
        driver.isActive = !driver.isActive;
        await driver.save();
        res.json(driver);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Registers a new driver from the Admin portal.
 * Creates the user in Firebase Auth and MongoDB.
 */
const registerDriver = async (req, res) => {
    try {
        const { email, password, name, phone, license, vehiclePlate } = req.body;

        // 1. Create purely via Backend Admin SDK
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name
        });

        // 2. Add custom claims for role management
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
};

/**
 * Provides analytical data for the admin dashboard.
 */
const getAnalytics = async (req, res) => {
    try {
        const totalRides = await Ride.countDocuments();
        const completedRides = await Ride.countDocuments({ status: 'COMPLETED' });
        const cancelledRides = await Ride.countDocuments({ status: 'CANCELLED' });
        
        // Aggregate rides per day for chart visualization
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
};

module.exports = {
    getAllDrivers,
    toggleDriverSuspension,
    registerDriver,
    getAnalytics
};
