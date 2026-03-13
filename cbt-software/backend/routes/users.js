const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createSchoolUserModel = require('../models/SchoolUser');
const { updateUser } = require('../services/userService');

// GET /api/users/search?email=
// Search users by email/username inside the caller's school DB (admin or teacher)
router.get('/search', verifyToken, async (req, res) => {
  try {
    const q = req.query.email || req.query.q || '';
    if (!q) return res.status(400).json({ message: 'email query required' });
    if (!['admin', 'teacher'].includes(req.user.role)) return res.status(403).json({ message: 'Not allowed' });

    const schoolId = req.user.schoolId;
    if (!schoolId) return res.status(400).json({ message: 'No schoolId associated with user' });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const SchoolUser = createSchoolUserModel(conn);
    const regex = new RegExp(q, 'i');
    const users = await SchoolUser.find({ username: regex }).select('_id username role');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to search users: ' + err.message });
  }
});

// GET /api/users/:id
// Fetch a specific user's basic profile
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Only admins, teachers, or the user themselves can view their profile
    if (!['admin', 'teacher'].includes(req.user.role) && req.user._id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'No schoolId associated with user' });
    }

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const SchoolUser = createSchoolUserModel(conn);
    
    // Fetch from central DB for the comprehensive source of truth
    const mongoose = require('mongoose');
    const User = mongoose.model('User');
    const user = await User.findById(userId).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Try to get specific school context metadata
    const schoolUser = await SchoolUser.findOne({ 
      $or: [
        { username: user.username },
        { username: user.email?.split('@')[0] }
      ]
    }).select('-password');

    res.json({ user, schoolUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
});

// PUT /api/users/:id
// Update user details like Name, Matric Number, Data
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Only admins, teachers, or the user themselves can update their profile
    if (!['admin', 'teacher'].includes(req.user.role) && req.user._id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    const updates = req.body;
    const schoolId = req.user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ message: 'No schoolId associated with user' });
    }

    const updatedUser = await updateUser(userId, updates, schoolId);
    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
});

module.exports = router;
