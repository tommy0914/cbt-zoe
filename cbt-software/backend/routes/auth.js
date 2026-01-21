const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Central User model
const { verifyToken } = require('../middleware/auth');

// --- Token-based Authentication Routes ---

// Login uses the central User model and returns a JWT
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message || 'Login failed' });
    }
    
    // Create JWT payload
    const payload = {
      userId: user._id,
      email: user.email,
      name: user.name,
      schools: user.schools.map(s => ({ schoolId: s.schoolId, role: s.role }))
    };

    // Sign the token
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_for_development';
    if (secret === 'your_super_secret_jwt_key_for_development') {
      console.warn('Warning: Using fallback JWT secret. Please set a strong JWT_SECRET in your .env file for production.');
    }
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        schools: user.schools,
        mustChangePassword: user.mustChangePassword || false
      }
    });
  })(req, res, next);
});

// Register a new user into the central User model
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
    });

    await newUser.save();

    // Automatically log in the user by generating a JWT
    const payload = {
      userId: newUser._id,
      email: newUser.email,
      name: newUser.name,
      schools: newUser.schools.map(s => ({ schoolId: s.schoolId, role: s.role }))
    };

    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_for_development';
    if (secret === 'your_super_secret_jwt_key_for_development') {
      console.warn('Warning: Using fallback JWT secret. Please set a strong JWT_SECRET in your .env file for production.');
    }
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        schools: newUser.schools
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Failed to register user', error: err.message });
  }
});

// Change password - used for first-time password reset and password updates
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Update password
    user.password = newPassword;
    user.mustChangePassword = false; // Clear the flag after password change
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
});

module.exports = router;