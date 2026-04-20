const User = require('../models/User');

// Normally we'd use firebase-admin here to verify the token:
// const admin = require('firebase-admin');

exports.registerUser = async (req, res) => {
  try {
    const { name, email, role, firebaseUid, campusId } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = await User.create({
      name,
      email,
      role,
      firebaseUid,
      campusId
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyLogin = async (req, res) => {
  try {
    // In production:
    // const { token } = req.body;
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // For scaffolding:
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
