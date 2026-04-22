const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');

// Create a new ride request
router.post('/request', rideController.requestRide);

// Update ride status (e.g. driver accepts)
router.put('/:id/status', rideController.updateRideStatus);

// Get User Ride History
router.get('/history/:uid', rideController.getRideHistory);

// Admin global tracking and recent history
router.get('/active', rideController.getActiveRidesAdmin);

// Post Feedback & Rating
router.put('/:id/rating', rideController.submitRideFeedback);

module.exports = router;
