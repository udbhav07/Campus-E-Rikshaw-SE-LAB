const Ride = require('../models/Ride');
const User = require('../models/User');

/**
 * Creates a new ride request from a passenger.
 */
const requestRide = async (req, res) => {
    try {
        const { passengerId, pickupLocation, dropLocation } = req.body;
        
        // Find passenger to get Mongo _id. Schema requires ObjectId.
        const user = await User.findOne({ firebaseUid: passengerId });
        
        if (!user) {
            return res.status(404).json({ message: "Passenger not found" });
        }

        const ride = await Ride.create({
            passengerId: user._id,
            pickupLocation,
            dropLocation,
            status: 'REQUESTED'
        });

        res.status(201).json(ride);
    } catch (err) {
        res.status(500).json({ message: 'Error requesting ride', error: err.message });
    }
};

/**
 * Updates the status of an existing ride (e.g., driver accepts, drops off).
 */
const updateRideStatus = async (req, res) => {
    try {
        const { status, driverFirebaseUid } = req.body;
        
        let driverId = null;
        let driverInfo = null;
        
        // Validate driver and block if suspended
        if (driverFirebaseUid) {
             const driver = await User.findOne({ firebaseUid: driverFirebaseUid });
             
             if (!driver) {
                 return res.status(404).json({ message: 'Driver not found' });
             }
             
             if (!driver.isActive) {
                 return res.status(403).json({ message: 'Your driver account has been suspended by an Administrator.' });
             }
             
             driverId = driver._id;
             driverInfo = { 
                 name: driver.name, 
                 vehicle: driver.campusId, // mapping campusId to vehicle/license
                 phone: driver.phone || 'N/A',
                 firebaseUid: driver.firebaseUid 
             };
        }

        const payload = { status };
        if (driverId) payload.driverId = driverId;

        const filter = { _id: req.params.id };
        
        // Safety check to prevent multiple drivers from accepting the same request
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

        // Return driver info alongside ride data for passenger UI update in one pass
        res.json({ ride, driverInfo });
    } catch (err) {
        res.status(500).json({ message: 'Error updating ride status', error: err.message });
    }
};

/**
 * Fetches the ride history for a specific user (passenger or driver).
 */
const getRideHistory = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.params.uid });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Determine query based on role
        const query = user.role === 'DRIVER' ? { driverId: user._id } : { passengerId: user._id };
        
        const rides = await Ride.find(query)
            .populate('passengerId', 'name')
            .populate('driverId', 'name campusId')
            .sort({ createdAt: -1 });
            
        res.json(rides);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching ride history', error: err.message });
    }
};

/**
 * Provides a summarized view of recent active rides across the system (primarily for Admin UI).
 */
const getActiveRidesAdmin = async (req, res) => {
    try {
        const rides = await Ride.find()
           .populate('driverId')
           .sort({ createdAt: -1 })
           .limit(50); // limit payload size
           
        res.json(rides);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching active rides data', error: err.message });
    }
};

/**
 * Submits rating and feedback for a finished ride.
 */
const submitRideFeedback = async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        
        const ride = await Ride.findByIdAndUpdate(
           req.params.id,
           { rating, feedback },
           { new: true }
        );
        
        res.json(ride);
    } catch (err) {
        res.status(500).json({ message: 'Error submitting feedback', error: err.message });
    }
};

module.exports = {
    requestRide,
    updateRideStatus,
    getRideHistory,
    getActiveRidesAdmin,
    submitRideFeedback
};
