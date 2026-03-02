const express = require('express');
const router = express.Router();
const School = require('../models/School');
const User = require('../models/User');
const { isAuthenticated, isSuperAdmin } = require('../middleware/auth');

// Create a new school (only for superadmins)
router.post('/', isAuthenticated, isSuperAdmin, async (req, res) => {
  try {
    const { name, adminId } = req.body;

    if (!name || !adminId) {
      return res.status(400).json({ message: 'School name and admin ID are required' });
    }

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const newSchool = new School({
      name,
      admin: adminId,
      superAdmin: req.user.id,
    });

    await newSchool.save();

    // Assign the school to the admin user
    admin.school = newSchool._id;
    admin.role = 'admin';
    await admin.save();

    const populatedSchool = await School.findById(newSchool._id).populate('admin', 'name email');

    res.status(201).json(populatedSchool);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Public listing of schools for any authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // return minimal fields unless more needed
    const schools = await School.find().select('name');
    res.json({ schools });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Endpoint used by students (and any user) to join a school
router.post('/:id/join', isAuthenticated, async (req, res) => {
  try {
    const schoolId = req.params.id;
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // prevent duplicates
    if (user.schools && user.schools.some(s => s.schoolId && s.schoolId.toString() === schoolId)) {
      return res.status(400).json({ message: 'Already a member of this school' });
    }
    // default role when joining is student
    user.schools = user.schools || [];
    user.schools.push({ schoolId, role: 'student' });
    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Error joining school:', err);
    res.status(500).json({ message: 'Server error', error: { message: err.message } });
  }
});

// Direct school creation route (self-service) enabled via env var
router.post('/create-direct', isAuthenticated, async (req, res) => {
  if (process.env.ALLOW_DIRECT_SCHOOL_CREATE !== 'true') {
    return res.status(403).json({ message: 'Direct school creation is disabled' });
  }

  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'School name is required' });
    }

    // resolve user id from token payload (could be _id or id)
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user information' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newSchool = new School({
      name,
      admin: user._id,
      superAdmin: user._id,
    });

    await newSchool.save();

    // update user role and assign to school list as admin
    user.school = newSchool._id;
    user.role = 'admin';
    // ensure schools array exists and contains this school
    if (!Array.isArray(user.schools)) user.schools = [];
    const already = user.schools.some(s => s.schoolId && s.schoolId.toString() === newSchool._id.toString());
    if (!already) {
      user.schools.push({ schoolId: newSchool._id, role: 'admin' });
    }
    await user.save();

    res.status(201).json({ school: newSchool, user });
  } catch (error) {
    console.error('Error in create-direct school:', error);
    if (error && error.stack) console.error(error.stack);
    res.status(500).json({ message: 'Server error', error: { message: error.message || 'unknown' } });
  }
});



module.exports = router;