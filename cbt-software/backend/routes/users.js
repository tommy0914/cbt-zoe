const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createSchoolUserModel = require('../models/SchoolUser');

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

module.exports = router;
