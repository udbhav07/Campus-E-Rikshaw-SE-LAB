const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');

// Create a new ride request
router.post('/request', async (req, res) => {
  try {
    const { passengerId, pickupLocation, dropLocation } = req.body;
    
    // We need passenger's Mongo _id to save, or use firebaseUid directly. The schema specifies ObjectId.
    // So we fetch the user by firebaseUid.
    const User = require('../models/User');
    const user = await User.findOne({ firebaseUid: passengerId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const ride = await Ride.create({
      passengerId: user._id,
      pickupLocation,
      dropLocation,
      status: 'REQUESTED'
    });

    res.status(201).json(ride);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update ride status (e.g. driver accepts)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, driverFirebaseUid } = req.body;
    
    const User = require('../models/User');
    let driverId = null;
    let driverInfo = null;
    
    // Validate driver and block if suspended
    if (driverFirebaseUid) {
         const driver = await User.findOne({ firebaseUid: driverFirebaseUid });
         if (!driver) return res.status(404).json({ message: 'Driver not found' });
         if (!driver.isActive) {
             return res.status(403).json({ message: 'Your driver account has been suspended by an Administrator.' });
         }
         
         driverId = driver._id;
         driverInfo = { 
             name: driver.name, 
             vehicle: driver.campusId, // mapping campusId to vehicle/license
             phone: driver.phone || 'N/A',
             firebaseUid: driver.firebaseUid // Crucial for tracking matching
         };
    }

    const payload = { status };
    if (driverId) payload.driverId = driverId;

    let filter = { _id: req.params.id };
    
    // ATOMIC FILTER: Only apply if it's REQUESTED
    if (status === 'ACCEPTED') {
         filter.status = 'REQUESTED';
    }

    const ride = await Ride.findOneAndUpdate(
      filter,
      payload,
      { new: true }
    );
    
    if (!ride) {
        return res.status(400).json({ message: 'Ride is no longer available or was previously accepted.' });
    }

    // Include driver info in the response so passenger can see it
    res.json({ ride, driverInfo });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get User Ride History
router.get('/history/:uid', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ firebaseUid: req.params.uid });
        if (!user) return res.status(404).json({ message: "User not found" });

        const query = user.role === 'DRIVER' ? { driverId: user._id } : { passengerId: user._id };
        const rides = await Ride.find(query).populate('passengerId', 'name').populate('driverId', 'name campusId').sort({ createdAt: -1 });
        
        res.json(rides);
    } catch(err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Admin global tracking and recent history
router.get('/active', async (req, res) => {
    try {
        // Fetch the 50 most recent rides across the whole system
        const rides = await Ride.find()
           .populate('driverId')
           .sort({ createdAt: -1 })
           .limit(50);
        res.json(rides);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Post Feedback & Rating
router.put('/:id/rating', async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const ride = await Ride.findByIdAndUpdate(
           req.params.id,
           { rating, feedback },
           { new: true }
        );
        res.json(ride);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
