// backend-bank/middleware/authMiddleware.js
// Ensure dotenv is loaded here too so process.env.JWT_SECRET is available when this module loads
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Use the same fallback secret as the main server so both sides validate consistently
const FALLBACK_JWT_SECRET = 'fallback_secret_key';

function verifyToken(req, res, next) {
  const tokenHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!tokenHeader) return res.status(401).json({ error: 'No token provided' });
  const token = String(tokenHeader).replace(/^Bearer\s+/i, '');
  const secret = process.env.JWT_SECRET || FALLBACK_JWT_SECRET;
  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

module.exports = { verifyToken, requireAdmin };
