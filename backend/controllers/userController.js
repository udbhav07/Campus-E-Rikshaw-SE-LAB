const User = require('../models/User');

/**
 * Synchronizes Firebase user creation with MongoDB.
 * Called immediately after a user registers on the frontend.
 */
const syncUser = async (req, res) => {
    try {
        const { firebaseUid, email, name, role } = req.body;
        
        let user = await User.findOne({ firebaseUid });
        
        // Create user if they don't exist
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
};

/**
 * Retrieves user details for profile rendering.
 */
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.params.uid });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found in database' });
        }
        
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Updates a user's profile details.
 */
const updateUserProfile = async (req, res) => {
    try {
        const { name, campusId } = req.body;
        
        const user = await User.findOneAndUpdate(
           { firebaseUid: req.params.uid },
           { name, campusId },
           { new: true } // Return updated document
        );
        
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    syncUser,
    getUserProfile,
    updateUserProfile
};
