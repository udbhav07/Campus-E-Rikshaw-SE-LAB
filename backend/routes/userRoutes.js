const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/user/sync
// Sync Firebase user creation to MongoDB. Called immediately after a user registers on frontend.
router.post('/sync', userController.syncUser);

// GET /api/user/:uid
// Fetch user details for profile rendering
router.get('/:uid', userController.getUserProfile);

// PUT /api/user/:uid
// Update passenger/driver profile details
router.put('/:uid', userController.updateUserProfile);

module.exports = router;
