const jwt = require('jsonwebtoken');
const SystemUser = require('../models/User');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createSchoolUserModel = require('../models/SchoolUser');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in your environment variables');
}
const DEV_FALLBACK_JWT_SECRET = 'your_super_secret_jwt_key_for_development';

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
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (primaryErr) {
      // Compatibility path: accept tokens minted with the legacy dev fallback secret.
      if (JWT_SECRET !== DEV_FALLBACK_JWT_SECRET) {
        payload = jwt.verify(token, DEV_FALLBACK_JWT_SECRET);
      } else {
        throw primaryErr;
      }
    }
    const requestedSchoolId = req.query.schoolId || req.body.schoolId || req.headers['x-school-id'];

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

    const schoolMemberships = Array.isArray(user.schools) ? user.schools : [];
    const fallbackSchoolId = user.school || schoolMemberships[0]?.schoolId || null;
    const resolvedSchoolId = requestedSchoolId || fallbackSchoolId;

    // Prefer school-specific role when a school context is known.
    const matchedMembership =
      resolvedSchoolId &&
      schoolMemberships.find((s) => s.schoolId?.toString() === resolvedSchoolId.toString());
    const userRole = user.role === 'superAdmin' ? 'superAdmin' : matchedMembership?.role || user.role;

    req.user = {
      ...user.toObject(),
      role: userRole,
      schoolId: resolvedSchoolId || undefined,
    };
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
    
    // superAdmin always has all roles
    if (req.user.role === 'superAdmin' || roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  };
}

// Basic permission mapping: action -> allowed roles
const PERMISSIONS = {
  view_audit: ['admin', 'superAdmin'],
  manage_classes: ['admin', 'teacher', 'superAdmin'],
  manage_tests: ['admin', 'teacher', 'superAdmin'],
  manage_questions: ['admin', 'teacher', 'superAdmin'],
  manage_users: ['admin', 'teacher', 'superAdmin'],
  create_user: ['admin', 'teacher', 'superAdmin'],
};

function requirePermission(action) {
  return function (req, res, next) {
    if (!req.user) {
      console.log('Permission Denied: No user in request');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const allowed = PERMISSIONS[action] || [];
    console.log(`Checking permission: action=${action}, userRole=${req.user.role}, allowedRoles=[${allowed.join(', ')}]`);
    
    if (allowed.length === 0) {
      console.log(`Permission Denied: Unknown action "${action}"`);
      return res.status(403).json({ message: 'Forbidden: unknown permission' });
    }
    
    if (allowed.includes(req.user.role)) {
      return next();
    }
    
    console.log(`Permission Denied: User role "${req.user.role}" not in allowed roles`);
    return res.status(403).json({ message: 'Forbidden: insufficient permission' });
  };
}

function isSuperAdmin(req, res, next) {
  if (req.user && req.user.role === 'superAdmin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: requires superadmin role' });
}

module.exports = { isLoggedIn, verifyToken, requireRole, requirePermission, PERMISSIONS, isSuperAdmin, isAuthenticated };
