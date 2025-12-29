const express = require('express');
const School = require('../models/School');
const SchoolRegistration = require('../models/SchoolRegistration');
const bcrypt = require('bcrypt');
const { sendOtpEmail } = require('../services/otpMailer');
const { getConnection } = require('../utils/dbManager');
const createSchoolUserModel = require('../models/SchoolUser');
const { verifyToken, isLoggedIn } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

const OTP_TTL_MINUTES = parseInt(process.env.SCHOOL_OTP_TTL_MINUTES || '15', 10);
const OTP_LENGTH = parseInt(process.env.SCHOOL_OTP_LENGTH || '6', 10);

function generateOtp(len = OTP_LENGTH) {
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

// Request an OTP for school registration. This should be sent to the admin's email in production.
router.post('/request-otp', async (req, res) => {
  try {
    const { schoolName, adminEmail } = req.body;
    if (!schoolName || !adminEmail) return res.status(400).json({ message: 'schoolName and adminEmail required' });

    const otp = generateOtp();
    const saltRounds = 10;
    const otpHash = await bcrypt.hash(otp, saltRounds);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const reg = new SchoolRegistration({ schoolName, adminEmail, otpHash, expiresAt });
    await reg.save();

    // Send OTP via email if configured, otherwise return OTP in response for dev convenience
    const mailResult = await sendOtpEmail(adminEmail, otp, reg._id.toString(), expiresAt.toISOString());
    if (mailResult.success && !mailResult.dev) {
      res.status(201).json({ registrationId: reg._id, expiresAt });
    } else {
      // Dev fallback: only include OTP when not in production
      console.log(`(DEV) School registration OTP for ${adminEmail}: ${otp} (expires at ${expiresAt.toISOString()})`);
      if (process.env.NODE_ENV !== 'production') {
        res.status(201).json({ registrationId: reg._id, expiresAt, otp });
      } else {
        res.status(201).json({ registrationId: reg._id, expiresAt });
      }
    }
  } catch (err) {
    console.error('Failed to create registration OTP:', err);
    res.status(500).json({ message: 'Failed to request OTP', error: err.message });
  }
});

// Complete registration using OTP and create the school + admin in per-school DB
router.post('/register', async (req, res) => {
  try {
    const { registrationId, otp, adminPassword } = req.body;
    if (!registrationId || !otp || !adminPassword)
      return res.status(400).json({ message: 'registrationId, otp and adminPassword required' });

    const reg = await SchoolRegistration.findById(registrationId);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    if (reg.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    const ok = await bcrypt.compare(String(otp), reg.otpHash);
    if (!ok) return res.status(400).json({ message: 'Invalid OTP' });

    // Generate DB name and create school+admin
    const safeName = reg.schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const timestamp = Date.now();
    const dbName = `school_${safeName}_${timestamp}`;

    const conn = await getConnection(dbName);
    const SchoolUser = createSchoolUserModel(conn);
    const adminUser = new SchoolUser({ username: reg.adminEmail, password: adminPassword, role: 'admin' });
    await adminUser.save();

    const school = new School({
      name: reg.schoolName,
      dbName,
      admin: { id: adminUser._id.toString(), username: adminUser.username },
    });
    await school.save();

    // delete registration record
    await SchoolRegistration.findByIdAndDelete(registrationId);

    res.status(201).json({
      message: 'School created',
      school: { _id: school._id, name: school.name, dbName: school.dbName },
      admin: { _id: adminUser._id, username: adminUser.username },
    });
  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ message: 'Failed to register school', error: err.message });
  }
});

// For backwards-compatibility, keep POST / but require explicit env override to allow direct creation
router.post('/create-direct', async (req, res) => {
  if (process.env.ALLOW_DIRECT_SCHOOL_CREATE !== 'true') {
    return res.status(403).json({ message: 'Direct school creation disabled. Use /request-otp and /register flow.' });
  }
  // Delegate to previous direct creation flow
  try {
    const { schoolName, adminEmail, adminPassword } = req.body;
    if (!schoolName || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'Missing schoolName, adminEmail, or adminPassword' });
    }

    const safeName = schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const timestamp = Date.now();
    const dbName = `school_${safeName}_${timestamp}`;
    const conn = await getConnection(dbName);
    const SchoolUser = createSchoolUserModel(conn);
    const adminUser = new SchoolUser({ username: adminEmail, password: adminPassword, role: 'admin' });
    await adminUser.save();
    const school = new School({
      name: schoolName,
      dbName,
      admin: { id: adminUser._id.toString(), username: adminUser.username },
    });
    await school.save();
    res.status(201).json({
      message: 'School created (direct)',
      school: { _id: school._id, name: school.name, dbName: school.dbName },
      admin: { _id: adminUser._id, username: adminUser.username },
    });
  } catch (err) {
    console.error('Direct school creation error:', err);
    res.status(500).json({ message: 'Failed to create school', error: err.message });
  }
});

// Get all schools
router.get('/', async (req, res) => {
  try {
    const schools = await School.find().populate('adminId', 'username');
    res.json({ schools });
  } catch (err) {
    console.error('Error fetching schools:', err);
    res.status(500).json({ message: 'Failed to fetch schools', error: err.message });
  }
});

// Get single school by ID
router.get('/:schoolId', verifyToken, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).populate('adminId', 'username');
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json({ school });
  } catch (err) {
    console.error('Error fetching school:', err);
    res.status(500).json({ message: 'Failed to fetch school', error: err.message });
  }
});

// Join a school
router.post('/:schoolId/join', isLoggedIn, async (req, res) => {
  try {
    const { schoolId } = req.params;
    const userId = req.user._id;

    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Add user to school
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already in the school
    if (user.schools.some(s => s.schoolId.toString() === schoolId)) {
      return res.status(400).json({ message: 'User is already a member of this school' });
    }

    user.schools.push({ schoolId, role: 'student' });
    await user.save();

    res.json(user);
  } catch (err) {
    console.error('Error joining school:', err);
    res.status(500).json({ message: 'Failed to join school', error: err.message });
  }
});

module.exports = router;
