const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createAttendanceModel = require('../models/Attendance');

// GET /api/attendance/:classId/:date
// Fetch attendance for a specific class and date
router.get('/:classId/:date', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, date } = req.params;
    const schoolId = req.user.schoolId;
    if (!schoolId) return res.status(400).json({ message: 'School ID missing from user' });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const Attendance = createAttendanceModel(conn);

    const attendance = await Attendance.findOne({ classId, date });
    
    // If not found, return empty array so frontend knows no attendance was taken
    if (!attendance) {
      return res.json({ attendance: { classId, date, records: [] } });
    }

    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance', error: err.message });
  }
});

// POST /api/attendance/:classId
// Save or update attendance for a specific date
router.post('/:classId', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, records } = req.body;
    const schoolId = req.user.schoolId;

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid data format. Requires date and records array.' });
    }

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const Attendance = createAttendanceModel(conn);

    let attendance = await Attendance.findOne({ classId, date });
    
    if (attendance) {
      // Update existing record
      attendance.records = records;
      attendance.takenBy = req.user._id;
      attendance.updatedAt = new Date();
    } else {
      // Create new record
      attendance = new Attendance({
        classId,
        date,
        records,
        takenBy: req.user._id
      });
    }

    await attendance.save();
    res.json({ message: 'Attendance saved successfully', attendance });
  } catch (err) {
    res.status(500).json({ message: 'Error saving attendance', error: err.message });
  }
});

module.exports = router;
