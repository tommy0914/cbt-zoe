const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Central User model

// --- Google OAuth Routes (Session-based) ---

// 1. The route to initiate Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. The callback route that Google redirects to after authentication
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login', // Redirect to your frontend login page on failure
  }),
  (req, res) => {
    // On successful authentication, redirect to a frontend page.
    // A session cookie is automatically set by passport.
    res.redirect('/'); // Redirect to the root (handled by App.jsx to go to dashboard)
  }
);

// 3. Route to check for a currently logged-in user (relies on the session cookie)
router.get('/me', (req, res) => {
  if (req.user) {
    // req.user is populated by passport if a valid session exists
    res.json({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        schools: req.user.schools,
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// 4. Route to log out (destroys the session)
router.post('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // Clears the session cookie
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// ... (rest of the file is the same until the login route)

// --- Local Login / Registration (Token-based) ---

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
        schools: user.schools
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

module.exports = router;