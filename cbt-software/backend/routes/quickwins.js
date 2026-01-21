const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Leaderboard = require('../models/Leaderboard');
const Certificate = require('../models/Certificate');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const auditLogger = require('../services/auditLogger');
const XLSX = require('xlsx');

// ============ ANNOUNCEMENTS ============

// Create announcement
router.post('/announcements/create', async (req, res) => {
  try {
    const { title, content, classId, priority, expiresAt, attachmentUrl } = req.body;
    const userId = req.user.id;

    if (!title || !content || !classId) {
      return res.status(400).json({ error: 'Title, content, and classId are required' });
    }

    const announcement = new Announcement({
      title,
      content,
      classId,
      schoolId: req.user.schoolId,
      createdBy: userId,
      priority: priority || 'low',
      expiresAt,
      attachmentUrl
    });

    await announcement.save();
    await announcement.populate('createdBy', 'name email');

    auditLogger.log(req.user.id, `Created announcement: ${title}`, req);

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get announcements for a class
router.get('/announcements/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const announcements = await Announcement.find({
      classId,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update announcement
router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, content, priority, updatedAt: new Date() },
      { new: true }
    );

    auditLogger.log(req.user.id, `Updated announcement: ${announcement.title}`, req);

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    auditLogger.log(req.user.id, `Deleted announcement: ${announcement.title}`, req);

    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LEADERBOARD ============

// Get class leaderboard
router.get('/leaderboard/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { limit = 10 } = req.query;

    const leaderboard = await Leaderboard.find({ classId })
      .sort({ averageScore: -1, points: -1 })
      .limit(parseInt(limit))
      .exec();

    // Add rank
    const ranked = leaderboard.map((entry, index) => ({
      ...entry.toObject(),
      rank: index + 1
    }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get test-specific leaderboard
router.get('/leaderboard/test/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { limit = 10 } = req.query;

    const leaderboard = await Leaderboard.find({ testId })
      .sort({ totalScore: -1 })
      .limit(parseInt(limit))
      .exec();

    const ranked = leaderboard.map((entry, index) => ({
      ...entry.toObject(),
      rank: index + 1
    }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student's leaderboard position
router.get('/leaderboard/student/:studentId/class/:classId', async (req, res) => {
  try {
    const { studentId, classId } = req.params;

    const entry = await Leaderboard.findOne({ studentId, classId });
    const totalInClass = await Leaderboard.countDocuments({ classId });
    const rank = await Leaderboard.countDocuments({
      classId,
      averageScore: { $gt: entry?.averageScore || 0 }
    }) + 1;

    res.json({
      ...entry?.toObject(),
      rank,
      totalStudents: totalInClass
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update leaderboard entry (called when test is graded)
router.post('/leaderboard/update', async (req, res) => {
  try {
    const { studentId, classId, testId, score, totalMarks, passed } = req.body;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    let entry = await Leaderboard.findOne({ studentId, classId });

    if (!entry) {
      entry = new Leaderboard({
        studentId,
        classId,
        schoolId: req.user.schoolId,
        studentName: student.name,
        studentEmail: student.email
      });
    }

    entry.testsAttempted += 1;
    entry.totalScore = (entry.totalScore || 0) + score;
    entry.averageScore = entry.totalScore / entry.testsAttempted;
    entry.points = (entry.points || 0) + Math.floor((score / totalMarks) * 100);

    if (passed) {
      entry.passCount += 1;
      entry.streak = (entry.streak || 0) + 1;
    } else {
      entry.streak = 0;
    }

    entry.lastUpdated = new Date();
    await entry.save();

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CERTIFICATES ============

// Get certificates for student
router.get('/certificates/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const certificates = await Certificate.find({ studentId })
      .sort({ issuedDate: -1 })
      .exec();

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get certificate by ID
router.get('/certificates/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create certificate (auto-generated when test is graded with passing score)
router.post('/certificates/create', async (req, res) => {
  try {
    const { studentId, testId, classId, score, totalMarks, testTitle } = req.body;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const percentage = Math.round((score / totalMarks) * 100);

    const certificate = new Certificate({
      studentId,
      testId,
      classId,
      schoolId: req.user.schoolId,
      studentName: student.name,
      studentEmail: student.email,
      testTitle,
      score,
      totalMarks,
      percentage,
      template: percentage >= 90 ? 'gold' : percentage >= 75 ? 'platinum' : 'standard'
    });

    await certificate.save();

    auditLogger.log(req.user.id, `Generated certificate for ${student.name}: ${testTitle}`, req);

    res.status(201).json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send certificate via email
router.post('/certificates/:id/send', async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { status: 'sent', sentAt: new Date() },
      { new: true }
    );

    // TODO: Send email with certificate
    // const emailService = require('../services/otpMailer');
    // await emailService.sendCertificateEmail(certificate.studentEmail, certificate);

    auditLogger.log(req.user.id, `Sent certificate: ${certificate.certificateNumber}`, req);

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ EXPORT TO CSV/EXCEL ============

// Export test results to Excel
router.get('/export/test-results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { format = 'xlsx' } = req.query;

    // Fetch all attempts for the test
    const attempts = await Attempt.find({ testId })
      .populate('studentId', 'name email')
      .exec();

    const data = attempts.map(attempt => ({
      'Student Name': attempt.studentId?.name || 'N/A',
      'Student Email': attempt.studentId?.email || 'N/A',
      'Score': attempt.totalScore || 0,
      'Percentage': attempt.percentage || 0,
      'Status': attempt.status || 'pending',
      'Submitted At': new Date(attempt.submittedAt).toLocaleString(),
      'Time Taken (mins)': Math.round((new Date(attempt.submittedAt) - new Date(attempt.createdAt)) / 60000)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');

    // Set column widths
    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=test-results.xlsx');

    XLSX.write(wb, { out: res, type: 'binary' });
    res.end();

    auditLogger.log(req.user.id, `Exported test results: ${testId}`, req);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export leaderboard to Excel
router.get('/export/leaderboard/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    const leaderboard = await Leaderboard.find({ classId })
      .sort({ averageScore: -1 })
      .exec();

    const data = leaderboard.map((entry, index) => ({
      'Rank': index + 1,
      'Student Name': entry.studentName,
      'Student Email': entry.studentEmail,
      'Average Score': entry.averageScore.toFixed(2),
      'Tests Attempted': entry.testsAttempted,
      'Passed': entry.passCount,
      'Points': entry.points,
      'Current Streak': entry.streak
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');

    ws['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=leaderboard.xlsx');

    XLSX.write(wb, { out: res, type: 'binary' });
    res.end();

    auditLogger.log(req.user.id, `Exported leaderboard: ${classId}`, req);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export class performance report
router.get('/export/class-report/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    const attempts = await Attempt.find({ classId })
      .populate('studentId', 'name email')
      .populate('testId', 'title')
      .exec();

    const data = attempts.map(attempt => ({
      'Student Name': attempt.studentId?.name || 'N/A',
      'Test Title': attempt.testId?.title || 'N/A',
      'Score': attempt.totalScore || 0,
      'Percentage': attempt.percentage || 0,
      'Status': attempt.status || 'pending',
      'Submitted At': new Date(attempt.submittedAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=class-report.xlsx');

    XLSX.write(wb, { out: res, type: 'binary' });
    res.end();

    auditLogger.log(req.user.id, `Exported class report: ${classId}`, req);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
