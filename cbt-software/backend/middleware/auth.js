const jwt = require('jsonwebtoken');
const SystemUser = require('../models/User');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createSchoolUserModel = require('../models/SchoolUser');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in your environment variables');
}

// Middleware for checking if a user is authenticated via session
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // If token contains a schoolId, fetch the user from that school's DB
    if (payload.schoolId) {
      const school = await School.findById(payload.schoolId);
      if (!school) return res.status(401).json({ message: 'School not found' });
      const conn = await getConnection(school.dbName);
      const SchoolUser = createSchoolUserModel(conn);
      const user = await SchoolUser.findById(payload.userId).select('-password');
      if (!user) return res.status(401).json({ message: 'User not found in school DB' });
      // attach school info and user
      req.user = { ...user.toObject(), schoolId: payload.schoolId };
      return next();
    }

    // Otherwise fall back to system user
    const user = await SystemUser.findById(payload.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    const userRole = user.role;

    req.user = { ...user.toObject(), role: userRole };
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  return verifyToken(req, res, next);
}

function requireRole(roleOrArray) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    const roles = Array.isArray(roleOrArray) ? roleOrArray : [roleOrArray];
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden: insufficient role' });
    next();
  };
}

// Basic permission mapping: action -> allowed roles
const PERMISSIONS = {
  view_audit: ['admin'],
  manage_classes: ['admin', 'teacher'],
  manage_tests: ['admin', 'teacher'],
  manage_questions: ['admin'],
  manage_users: ['admin'],
  create_user: ['admin'],
};

function requirePermission(action) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    const allowed = PERMISSIONS[action] || [];
    if (allowed.length === 0) return res.status(403).json({ message: 'Forbidden: unknown permission' });
    if (!allowed.includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden: insufficient permission' });
    next();
  };
}

function isSuperAdmin(req, res, next) {
  if (req.user && req.user.role === 'superAdmin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: requires superadmin role' });
}

module.exports = { isLoggedIn, verifyToken, requireRole, requirePermission, PERMISSIONS, isSuperAdmin, isAuthenticated };