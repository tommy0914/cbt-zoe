const express = require('express');
const router = express.Router();
const { verifyToken, requirePermission } = require('../middleware/auth');
const Audit = require('../models/Audit');

const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { createUser } = require('../services/userService');

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
  body('email').isEmail().withMessage('Must be a valid email address')
    .custom(async (email) => {
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
      { name, email, password: 'defaultPassword', role: 'teacher', department, staffId }, // Consider a more secure way to handle initial passwords
      schoolId
    );

    res.status(201).json({ message: 'Teacher created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create teacher', error: error.message });
  }
});

// Create a new student
router.post('/students', verifyToken, requirePermission('create_user'), validateStudentCreation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, matricNumber, level } = req.body;
    const schoolId = req.user.schoolId; // Assuming admin's schoolId is in the token

    const newUser = await createUser(
      { name, email, password: 'defaultPassword', role: 'student', matricNumber, level }, // Consider a more secure way to handle initial passwords
      schoolId
    );

    res.status(201).json({ message: 'Student created successfully', user: newUser });
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
