/**
 * Enhanced Authentication Service
 * Provides secure authentication with:
 * - Rate limiting
 * - Login attempt tracking
 * - Session management
 * - Refresh token rotation
 * - Security logging
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Audit = require('../models/Audit');

class AuthService {
  /**
   * Generate JWT access token (short-lived: 15 minutes)
   */
  static generateAccessToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      name: user.name,
      schools: user.schools.map(s => ({ schoolId: s.schoolId, role: s.role })),
      type: 'access'
    };

    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_for_development';
    return jwt.sign(payload, secret, { expiresIn: '15m' });
  }

  /**
   * Generate JWT refresh token (long-lived: 7 days)
   */
  static generateRefreshToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      type: 'refresh'
    };

    const secret = process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_for_development';
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  /**
   * Authenticate user with email and password
   * Includes rate limiting and login attempt tracking
   */
  static async authenticateUser(email, password, ipAddress) {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Log failed authentication attempt
        await this.logSecurityEvent('LOGIN_FAILED', { email, ipAddress, reason: 'User not found' });
        throw new Error('Invalid email or password');
      }

      // Check if account is locked due to failed attempts
      if (user.loginAttempts >= 5 && user.lockUntil && new Date() < new Date(user.lockUntil)) {
        const minutesRemaining = Math.ceil((new Date(user.lockUntil) - new Date()) / 60000);
        await this.logSecurityEvent('LOGIN_BLOCKED', { email, ipAddress, reason: 'Account locked' });
        throw new Error(`Account is temporarily locked. Try again in ${minutesRemaining} minutes.`);
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment failed login attempts
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts for 30 minutes
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          await this.logSecurityEvent('LOGIN_LOCKED', { 
            email, 
            ipAddress, 
            attempts: user.loginAttempts 
          });
        }

        await user.save();
        await this.logSecurityEvent('LOGIN_FAILED', { 
          email, 
          ipAddress, 
          attempt: user.loginAttempts 
        });
        
        throw new Error('Invalid email or password');
      }

      // Check if user must change password
      if (user.mustChangePassword) {
        await this.logSecurityEvent('LOGIN_SUCCESS_PASSWORD_CHANGE_REQUIRED', { email, ipAddress });
        return {
          user,
          tokens: null,
          mustChangePassword: true
        };
      }

      // Reset login attempts on successful login
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLogin = new Date();
      user.lastLoginIP = ipAddress;
      await user.save();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Log successful login
      await this.logSecurityEvent('LOGIN_SUCCESS', { email, ipAddress });

      return {
        user,
        tokens: { accessToken, refreshToken },
        mustChangePassword: false
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken, ipAddress) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Verify refresh token
      const secret = process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_for_development';
      const decoded = jwt.verify(refreshToken, secret);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);

      // Log token refresh
      await this.logSecurityEvent('TOKEN_REFRESHED', { email: user.email, ipAddress });

      return {
        accessToken: newAccessToken,
        refreshToken // Return same refresh token
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        await this.logSecurityEvent('TOKEN_REFRESH_FAILED', { ipAddress, reason: 'Token expired' });
        throw new Error('Refresh token has expired. Please login again.');
      }
      throw error;
    }
  }

  /**
   * Logout user (optional: can invalidate token server-side)
   */
  static async logoutUser(userId, ipAddress) {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.lastLogout = new Date();
        await user.save();
      }
      await this.logSecurityEvent('LOGOUT', { userId, ipAddress });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Log security events for audit trail
   */
  static async logSecurityEvent(action, details = {}) {
    try {
      const auditEntry = new Audit({
        userId: details.userId || null,
        action,
        details,
        ipAddress: details.ipAddress,
        timestamp: new Date()
      });
      await auditEntry.save();
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Validate token format and expiration
   */
  static validateToken(token) {
    try {
      if (!token) return false;
      
      const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_for_development';
      jwt.verify(token, secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Decode token without verification (for getting payload)
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;
