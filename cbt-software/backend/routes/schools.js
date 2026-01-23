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

    res.status(201).json(newSchool);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


router.get('/', isAuthenticated, isSuperAdmin, async (req, res) => {
  try {
    const schools = await School.find().populate('admin', 'name email');
    res.json(schools);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;