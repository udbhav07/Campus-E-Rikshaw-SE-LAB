const express = require('express');
const router = express.Router();

// Mock Auth Controller logic for scaffolding
// In reality, this would verify the Firebase token
const { registerUser, verifyLogin } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify', verifyLogin);

module.exports = router;
