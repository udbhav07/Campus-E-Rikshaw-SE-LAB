const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/user/sync
// Sync Firebase user creation to MongoDB. Called immediately after a user registers on frontend.
router.post('/sync', async (req, res) => {
  try {
    const { firebaseUid, email, name, role } = req.body;
    
    // Check if exists
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
       user = await User.create({
         firebaseUid,
         email,
         name,
         role: role || 'PASSENGER',
         isActive: true
       });
    }
    
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/:uid
// Fetch user details for profile rendering
router.get('/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.uid });
    if (!user) return res.status(404).json({ message: 'User not found in DB' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/:uid
// Update passenger/driver profile details
router.put('/:uid', async (req, res) => {
  try {
    const { name, campusId } = req.body;
    const user = await User.findOneAndUpdate(
       { firebaseUid: req.params.uid },
       { name, campusId },
       { new: true }
    );
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
