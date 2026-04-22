const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Get all drivers
router.get('/drivers', adminController.getAllDrivers);

// Toggle driver suspension
router.put('/drivers/:id/suspend', adminController.toggleDriverSuspension);

// Admin-controlled driver registration
router.post('/register-driver', adminController.registerDriver);

// Get analytics data
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
