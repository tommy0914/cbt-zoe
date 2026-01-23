/**
 * Enhanced Authentication Routes
 * Implements:
 * - Secure login with rate limiting
 * - Token refresh mechanism
 * - Logout
 * - Password change
 * - Session management
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const AuthService = require('../services/authService');
const User = require('../models/User');
const {
  rateLimitLogin,
  verifyToken,
  verifyRefreshToken,
  validateLoginInput,
  getClientIp,
  securityHeaders
} = require('../middleware/secureAuth');

// Apply security headers to all auth routes
router.use(securityHeaders);

/**
 * POST /api/auth/login
 * Login with email and password
 * Returns access token and refresh token
 */
router.post('/login', rateLimitLogin, validateLoginInput, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = getClientIp(req);

    // Authenticate user
    const result = await AuthService.authenticateUser(email, password, ipAddress);

    // If password change is required
    if (result.mustChangePassword) {
      return res.status(200).json({
        mustChangePassword: true,
        message: 'You must change your password before logging in',
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email
        }
      });
    }

    // Set refresh token in secure HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    // Return success response
    return res.status(200).json({
      success: true,
      accessToken: result.tokens.accessToken,
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        schools: result.user.schools
      },
      expiresIn: 900 // 15 minutes in seconds
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', validateLoginInput, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const ipAddress = getClientIp(req);

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      await AuthService.logSecurityEvent('REGISTRATION_FAILED', {
        email,
        ipAddress,
        reason: 'Email already exists'
      });
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      isEmailVerified: false, // Require email verification in production
      mustChangePassword: false
    });

    await newUser.save();

    // Generate tokens
    const accessToken = AuthService.generateAccessToken(newUser);
    const refreshToken = AuthService.generateRefreshToken(newUser);

    // Log registration
    await AuthService.logSecurityEvent('REGISTRATION_SUCCESS', { email, ipAddress });

    // Set refresh token in secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      expiresIn: 900
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', verifyRefreshToken, async (req, res) => {
  try {
    const ipAddress = getClientIp(req);
    const { refreshToken } = req.body;

    // Refresh token
    const result = await AuthService.refreshAccessToken(refreshToken, ipAddress);

    // Set new refresh token in cookie if provided
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    return res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      expiresIn: 900
    });
  } catch (error) {
    res.clearCookie('refreshToken');
    return res.status(401).json({ message: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const ipAddress = getClientIp(req);

    // Log logout
    await AuthService.logoutUser(req.user.userId, ipAddress);

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { path: '/' });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Logout failed' });
  }
});

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const ipAddress = getClientIp(req);

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Get user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      await AuthService.logSecurityEvent('PASSWORD_CHANGE_FAILED', {
        userId: user._id,
        ipAddress,
        reason: 'Invalid current password'
      });
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.mustChangePassword = false;
    user.loginAttempts = 0;
    await user.save();

    // Log password change
    await AuthService.logSecurityEvent('PASSWORD_CHANGED', {
      userId: user._id,
      ipAddress
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ message: 'Password change failed' });
  }
});

/**
 * POST /api/auth/verify-token
 * Verify if token is valid
 */
router.post('/verify-token', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    const isValid = AuthService.validateToken(token);

    if (!isValid) {
      return res.status(200).json({ valid: false, message: 'Token is invalid or expired' });
    }

    const decoded = AuthService.decodeToken(token);

    return res.status(200).json({
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name
      }
    });
  } catch (error) {
    return res.status(500).json({ valid: false, message: 'Token verification failed' });
  }
});

module.exports = router;
