const express = require('express');
const router = express.Router();
const { verifyToken, requirePermission } = require('../middleware/auth');
const Audit = require('../models/Audit');

const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const School = require('../models/School');
const { createUser } = require('../services/userService');
const { generateTemporaryPassword } = require('../services/passwordService');
const { sendCredentialsEmail } = require('../services/otpMailer');

// Validation chain for creating a teacher
const validateTeacherCreation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Must be a valid email address')
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('A user with this email already exists.');
      }
    }),
  body('department').notEmpty().withMessage('Department is required'),
  body('staffId').notEmpty().withMessage('Staff ID is required'),
];

// Validation chain for creating a student
const validateStudentCreation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Must be a valid email address')
    .custom(async (email) => {
      if (!email) return true;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('A user with this email already exists.');
      }
    }),
  body('matricNumber').notEmpty().withMessage('Matriculation number is required'),
  body('level').notEmpty().withMessage('Level is required'),
];

// Create a new teacher
router.post('/teachers', verifyToken, requirePermission('create_user'), validateTeacherCreation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, department, staffId } = req.body;
    const schoolId = req.user.schoolId; // Assuming admin's schoolId is in the token

    const newUser = await createUser(
      { name, email, password: 'defaultPassword', role: 'teacher', department, staffId }, 
      schoolId
    );

    res.status(201).json({ message: 'Teacher created successfully', user: newUser });
  } catch (error) {
    console.error('Teacher creation failed:', error);
    res.status(500).json({ message: 'Failed to create teacher', error: error.message });
  }
});

// Assign an existing user as a teacher to the school
router.post('/assign-teacher', verifyToken, requirePermission('create_user'), async (req, res) => {
  try {
    const { email } = req.body;
    const schoolId = req.user.schoolId;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found in the global registry. Please create them first.' });
    }

    // Update their role in the current school
    if (!user.schools) user.schools = [];
    
    const existingSchoolRecord = user.schools.find(s => s.schoolId && s.schoolId.toString() === schoolId.toString());
    if (existingSchoolRecord) {
      existingSchoolRecord.role = 'teacher';
    } else {
      user.schools.push({ schoolId, role: 'teacher' });
    }

    // Set as primary if they don't have one
    if (!user.school || user.role === 'student' || !user.role) {
      user.school = schoolId;
      user.role = 'teacher';
    }

    await user.save();

    res.json({ message: 'User successfully assigned as a teacher', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign teacher', error: error.message });
  }
});

// Create a new student
router.post('/students', verifyToken, requirePermission('create_user'), validateStudentCreation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let { name, email, matricNumber, level } = req.body;
    const schoolId = req.user.schoolId; // Assuming admin's schoolId is in the token

    // Generate dummy email if none provided
    const isDummyEmail = !email || email.trim() === '';
    if (isDummyEmail) {
      email = `${matricNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.local`;
      
      // Check if dummy email already exists (unlikely unless duplicate matric numbers)
      const existingDummy = await User.findOne({ email });
      if (existingDummy) {
        return res.status(400).json({ errors: [{ msg: 'A student with this Matriculation Number already exists.' }] });
      }
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();

    // Create user with temporary password and mustChangePassword flag
    const newUser = await createUser(
      { 
        name, 
        email, 
        password: tempPassword, 
        role: 'student', 
        matricNumber, 
        level,
        mustChangePassword: true // Force password change on first login
      },
      schoolId
    );

    // Get school name for email
    const dbManager = require('../utils/dbManager');
    const db = dbManager.getConnection(schoolId);
    const School = require('../models/School');
    const schoolConnection = db ? db.model('School', School.schema) : require('../models/School');
    const school = await schoolConnection.findById(schoolId);
    const schoolName = school ? school.name : 'Your School';

    // Only send credentials email if it's a real email
    if (!isDummyEmail) {
      await sendCredentialsEmail(email, tempPassword, name, schoolName);
      res.status(201).json({ 
        message: 'Student created successfully. Credentials sent to student email.',
        user: newUser 
      });
    } else {
      res.status(201).json({ 
        message: 'Student created successfully. Please provide this temporary password to the student: ' + tempPassword,
        user: newUser,
        temporaryPassword: tempPassword
      });
    }

  } catch (error) {
    res.status(500).json({ message: 'Failed to create student', error: error.message });
  }
});


// Query audit logs - requires permission 'view_audit'
router.get('/audit', verifyToken, requirePermission('view_audit'), async (req, res) => {
  try {
    const { userId, action, resourceType, limit = 100, since } = req.query;
    const q = {};
    if (userId) q.userId = userId;
    if (action) q.action = action;
    if (resourceType) q.resourceType = resourceType;
    if (since) q.createdAt = { $gte: new Date(since) };
    const logs = await Audit.find(q).sort({ createdAt: -1 }).limit(parseInt(limit, 10));
    res.json({ logs });
  } catch (err) {
    console.error('Error querying audit logs:', err);
    res.status(500).json({ message: 'Failed to query audit logs' });
  }
});

module.exports = router;
