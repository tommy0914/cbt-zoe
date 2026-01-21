const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../services/auditLogger');
const School = require('../models/School');
const User = require('../models/User');
const { getConnection } = require('../utils/dbManager');
const createSchoolClassroom = require('../models/SchoolClassroom');
const createEnrollmentRequest = require('../models/EnrollmentRequest');
const { generateTemporaryPassword } = require('../services/passwordService');
const { sendCredentialsEmail } = require('../services/otpMailer');

const upload = multer({ storage: multer.memoryStorage() });

// Get available classes for a student (classes they're not enrolled in)
// GET /api/enrollment/available-classes
router.get('/available-classes', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view available classes' });
    }

    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);

    // Get all classes in the school
    const allClasses = await SchoolClassroom.find().sort({ createdAt: -1 });

    // Get classes the student is already in
    const enrolledClassIds = allClasses
      .filter(cls => cls.members.map(m => m.toString()).includes(req.user._id.toString()))
      .map(cls => cls._id.toString());

    // Get classes with pending enrollment requests
    const EnrollmentRequest = createEnrollmentRequest(conn);
    const pendingRequests = await EnrollmentRequest.find({
      studentId: req.user._id,
      status: 'pending'
    });
    const pendingClassIds = pendingRequests.map(req => req.classId.toString());

    // Filter available classes (not enrolled and not pending)
    const availableClasses = allClasses
      .filter(cls => 
        !enrolledClassIds.includes(cls._id.toString()) && 
        !pendingClassIds.includes(cls._id.toString())
      )
      .map(cls => ({
        _id: cls._id,
        name: cls.name,
        subjects: cls.subjects,
        teacher: cls.teacherId || 'No teacher assigned',
      }));

    res.json({ availableClasses, pendingCount: pendingRequests.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch available classes: ' + err.message });
  }
});

// Request enrollment in a class
// POST /api/enrollment/request
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { classId } = req.body;
    if (!classId) return res.status(400).json({ message: 'Class ID is required' });
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can request enrollment' });
    }

    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    const EnrollmentRequest = createEnrollmentRequest(conn);

    // Check if class exists
    const cls = await SchoolClassroom.findById(classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    // Check if already enrolled
    if (cls.members.map(m => m.toString()).includes(req.user._id.toString())) {
      return res.status(400).json({ message: 'Already enrolled in this class' });
    }

    // Check if request already exists
    const existingRequest = await EnrollmentRequest.findOne({
      studentId: req.user._id,
      classId,
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Enrollment request already pending for this class' });
    }

    // Create enrollment request
    const enrollmentRequest = new EnrollmentRequest({
      studentId: req.user._id,
      classId,
      schoolId: req.user.schoolId,
    });
    await enrollmentRequest.save();

    await logAudit({
      action: 'request_enrollment',
      resourceType: 'enrollment',
      resourceId: enrollmentRequest._id,
      user: req.user,
      details: { classId },
      ip: req.ip,
    });

    res.status(201).json({ message: 'Enrollment request submitted', request: enrollmentRequest });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit enrollment request: ' + err.message });
  }
});

// Get pending enrollment requests (admin/teacher)
// GET /api/enrollment/requests
router.get('/requests', verifyToken, async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const EnrollmentRequest = createEnrollmentRequest(conn);
    const SchoolClassroom = createSchoolClassroom(conn);

    let requests = [];

    if (req.user.role === 'admin') {
      // Admins see all requests
      requests = await EnrollmentRequest.find({ status: 'pending' })
        .populate('studentId', 'name email')
        .populate('classId', 'name')
        .sort({ requestedAt: -1 });
    } else if (req.user.role === 'teacher') {
      // Teachers see requests for their classes only
      const teacherClasses = await SchoolClassroom.find({ teacherId: req.user._id });
      const classIds = teacherClasses.map(c => c._id);
      requests = await EnrollmentRequest.find({ 
        classId: { $in: classIds },
        status: 'pending' 
      })
        .populate('studentId', 'name email')
        .populate('classId', 'name')
        .sort({ requestedAt: -1 });
    } else {
      return res.status(403).json({ message: 'Not authorized to view enrollment requests' });
    }

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch enrollment requests: ' + err.message });
  }
});

// Approve enrollment request
// POST /api/enrollment/approve/:requestId
router.post('/approve/:requestId', verifyToken, async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const EnrollmentRequest = createEnrollmentRequest(conn);
    const SchoolClassroom = createSchoolClassroom(conn);

    const enrollmentRequest = await EnrollmentRequest.findById(req.params.requestId);
    if (!enrollmentRequest) return res.status(404).json({ message: 'Request not found' });

    // Verify permission
    if (req.user.role === 'teacher') {
      const cls = await SchoolClassroom.findById(enrollmentRequest.classId);
      if (!cls || cls.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to approve this request' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add student to class
    const cls = await SchoolClassroom.findById(enrollmentRequest.classId);
    if (cls && !cls.members.map(m => m.toString()).includes(enrollmentRequest.studentId.toString())) {
      cls.members.push(enrollmentRequest.studentId);
      await cls.save();
    }

    // Update request status
    enrollmentRequest.status = 'approved';
    enrollmentRequest.respondedAt = new Date();
    enrollmentRequest.respondedBy = req.user._id;
    await enrollmentRequest.save();

    await logAudit({
      action: 'approve_enrollment',
      resourceType: 'enrollment',
      resourceId: enrollmentRequest._id,
      user: req.user,
      details: { classId: enrollmentRequest.classId, studentId: enrollmentRequest.studentId },
      ip: req.ip,
    });

    res.json({ message: 'Enrollment request approved', request: enrollmentRequest });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve request: ' + err.message });
  }
});

// Reject enrollment request
// POST /api/enrollment/reject/:requestId
router.post('/reject/:requestId', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const EnrollmentRequest = createEnrollmentRequest(conn);
    const SchoolClassroom = createSchoolClassroom(conn);

    const enrollmentRequest = await EnrollmentRequest.findById(req.params.requestId);
    if (!enrollmentRequest) return res.status(404).json({ message: 'Request not found' });

    // Verify permission
    if (req.user.role === 'teacher') {
      const cls = await SchoolClassroom.findById(enrollmentRequest.classId);
      if (!cls || cls.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to reject this request' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update request status
    enrollmentRequest.status = 'rejected';
    enrollmentRequest.respondedAt = new Date();
    enrollmentRequest.respondedBy = req.user._id;
    enrollmentRequest.rejectionReason = reason || null;
    await enrollmentRequest.save();

    await logAudit({
      action: 'reject_enrollment',
      resourceType: 'enrollment',
      resourceId: enrollmentRequest._id,
      user: req.user,
      details: { classId: enrollmentRequest.classId, studentId: enrollmentRequest.studentId, reason },
      ip: req.ip,
    });

    res.json({ message: 'Enrollment request rejected', request: enrollmentRequest });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject request: ' + err.message });
  }
});

// Bulk enroll students via CSV (admin only)
// POST /api/enrollment/bulk-enroll
router.post('/bulk-enroll', verifyToken, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file is required' });

    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty' });
    }

    const results = {
      success: [],
      failed: [],
    };

    // Expected columns: email, className (or classId)
    for (const row of data) {
      try {
        const { email, classId, className } = row;

        if (!email) {
          results.failed.push({ row, error: 'Email is required' });
          continue;
        }

        // Find student by email
        let student = await User.findOne({ email: email.toLowerCase() });
        let isNewStudent = false;

        // If student doesn't exist, create account with temporary password
        if (!student) {
          const tempPassword = generateTemporaryPassword();
          student = new User({
            name: row.name || email.split('@')[0], // Use provided name or email prefix
            email: email.toLowerCase(),
            password: tempPassword,
            mustChangePassword: true
          });
          await student.save();
          isNewStudent = true;

          // Send credentials email for new student
          await sendCredentialsEmail(email, tempPassword, student.name, school.name);
        }

        // Find class
        let cls;
        if (classId) {
          cls = await SchoolClassroom.findById(classId);
        } else if (className) {
          cls = await SchoolClassroom.findOne({ name: className });
        }

        if (!cls) {
          results.failed.push({ row, error: 'Class not found' });
          continue;
        }

        // Check if already enrolled
        if (cls.members.map(m => m.toString()).includes(student._id.toString())) {
          results.failed.push({ row, error: 'Student already enrolled in this class' });
          continue;
        }

        // Add student to class
        cls.members.push(student._id);
        await cls.save();

        results.success.push({ email, className: cls.name, isNewStudent });
      } catch (err) {
        results.failed.push({ row, error: err.message });
      }
    }

    await logAudit({
      action: 'bulk_enroll',
      resourceType: 'enrollment',
      user: req.user,
      details: { successCount: results.success.length, failedCount: results.failed.length },
      ip: req.ip,
    });

    res.json({ 
      message: 'Bulk enrollment completed', 
      results 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process bulk enrollment: ' + err.message });
  }
});

module.exports = router;
