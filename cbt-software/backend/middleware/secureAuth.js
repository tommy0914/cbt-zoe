/**
 * Enhanced Authentication Middleware
 * Provides:
 * - Rate limiting
 * - Token verification
 * - IP validation
 * - CSRF protection
 * - Security headers
 */

const jwt = require('jsonwebtoken');

// Rate limiting store (in production, use Redis)
const loginAttempts = new Map();

/**
 * Rate limiting middleware for login endpoint
 * Limits: 5 attempts per 15 minutes per IP
 */
const rateLimitLogin = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  // Initialize IP entry if doesn't exist
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, []);
  }

  // Get attempts for this IP
  let attempts = loginAttempts.get(ip);

  // Remove old attempts (older than 15 minutes)
  attempts = attempts.filter(time => now - time < fifteenMinutes);
  loginAttempts.set(ip, attempts);

  // Check if exceeded limit
  if (attempts.length >= 5) {
    return res.status(429).json({
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: 900
    });
  }

  // Add current attempt
  attempts.push(now);
  loginAttempts.set(ip, attempts);

  next();
};

/**
 * Verify JWT token in Authorization header
 * Expected format: Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header is missing' });
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid authorization header format' });
    }

    const token = parts[1];

    // Verify token
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_for_development';
    const decoded = jwt.verify(token, secret);

    // Check token type
    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Attach user info to request
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const secret = process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_for_development';
    const decoded = jwt.verify(refreshToken, secret);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    req.refreshTokenData = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Refresh token has expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

/**
 * Check user role
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Extract role from request - customize based on your role structure
    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'You do not have permission for this action' });
    }

    next();
  };
};

/**
 * Check user has access to specific school
 */
const checkSchoolAccess = (req, res, next) => {
  const schoolId = req.params.schoolId || req.body.schoolId;
  
  if (!schoolId) {
    return next(); // School ID not required
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Check if user has access to school
  const hasAccess = req.user.schools?.some(s => s.schoolId === schoolId);

  if (!hasAccess) {
    return res.status(403).json({ message: 'You do not have access to this school' });
  }

  next();
};

/**
 * CSRF protection middleware
 * Validates X-CSRF-Token header for non-GET requests
 */
const csrfProtection = (req, res, next) => {
  // Skip for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;

  if (!csrfToken || csrfToken !== sessionToken) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
};

/**
 * Set security headers
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  next();
};

/**
 * Validate input
 */
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  // Validate email
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Valid password is required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  if (password.length > 128) {
    return res.status(400).json({ message: 'Password is too long' });
  }

  next();
};

/**
 * Get IP address from request
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.ip
  );
};

module.exports = {
  rateLimitLogin,
  verifyToken,
  verifyRefreshToken,
  checkRole,
  checkSchoolAccess,
  csrfProtection,
  securityHeaders,
  validateLoginInput,
  getClientIp
};
