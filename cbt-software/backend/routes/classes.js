const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../services/auditLogger');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createSchoolClassroom = require('../models/SchoolClassroom');

// Create a class (admin or teacher)
// POST /api/classes
router.post('/', verifyToken, async (req, res) => {
  const { name, subjects, teacherId } = req.body;
  if (!name) return res.status(400).json({ message: 'Class name is required' });
  if (!req.user.schoolId) return res.status(400).json({ message: 'User must belong to a school' });

  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    const cls = new SchoolClassroom({
      name,
      subjects: Array.isArray(subjects) ? subjects : [],
      teacherId: teacherId || null,
    });
    await cls.save();
    // Audit log: class created
    try {
      await logAudit({
        action: 'create_class',
        resourceType: 'classroom',
        resourceId: cls._id,
        user: req.user,
        details: { name },
        ip: req.ip,
      });
    } catch {}
    res.status(201).json({ message: 'Class created', class: cls });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create class: ' + err.message });
  }
});

// List classes (requires authentication) — filtered by school
// GET /api/classes
router.get('/', verifyToken, async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    let classes;
    if (req.user.role === 'admin') {
      classes = await SchoolClassroom.find().sort({ createdAt: -1 });
    } else if (req.user.role === 'teacher') {
      classes = await SchoolClassroom.find({ teacherId: req.user._id.toString() }).sort({ createdAt: -1 });
    } else {
      classes = await SchoolClassroom.find({ members: req.user._id.toString() }).sort({ createdAt: -1 });
    }
    res.json({ classes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list classes: ' + err.message });
  }
});

// Get single class (requires authentication)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    const cls = await SchoolClassroom.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({ class: cls });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch class: ' + err.message });
  }
});

// Update class (admin)
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, subjects, teacherId } = req.body;
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    const cls = await SchoolClassroom.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (name) cls.name = name;
    if (Array.isArray(subjects)) cls.subjects = subjects;
    if (teacherId) cls.teacherId = teacherId;
    await cls.save();
    try {
      await logAudit({
        action: 'update_class',
        resourceType: 'classroom',
        resourceId: cls._id,
        user: req.user,
        details: { name, subjects, teacherId },
        ip: req.ip,
      });
    } catch {}
    res.json({ message: 'Class updated', class: cls });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update class: ' + err.message });
  }
});

// Delete class (admin)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    await SchoolClassroom.deleteOne({ _id: req.params.id });
    try {
      await logAudit({
        action: 'delete_class',
        resourceType: 'classroom',
        resourceId: req.params.id,
        user: req.user,
        ip: req.ip,
      });
    } catch {}
    res.json({ message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete class: ' + err.message });
  }
});

// Add a subject to a class (admin)
// POST /api/classes/:id/subjects  body: { subject }
router.post('/:id/subjects', verifyToken, async (req, res) => {
  const { subject } = req.body;
  if (!subject) return res.status(400).json({ message: 'Subject is required' });
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    const cls = await SchoolClassroom.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    // allow if admin or teacher of this class
    if (req.user.role !== 'admin' && (!cls.teacherId || cls.teacherId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not allowed to add subject' });
    }
    if (!cls.subjects.includes(subject)) cls.subjects.push(subject);
    await cls.save();
    try {
      await logAudit({
        action: 'add_subject',
        resourceType: 'classroom',
        resourceId: cls._id,
        user: req.user,
        details: { subject },
        ip: req.ip,
      });
    } catch {}
    res.json({ message: 'Subject added', class: cls });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add subject: ' + err.message });
  }
});

// Remove a subject from a class (admin)
// DELETE /api/classes/:id/subjects/:subject
router.delete('/:id/subjects/:subject', verifyToken, async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    const cls = await SchoolClassroom.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (req.user.role !== 'admin' && (!cls.teacherId || cls.teacherId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not allowed to remove subject' });
    }
    cls.subjects = cls.subjects.filter((s) => s !== subject);
    await cls.save();
    try {
      await logAudit({
        action: 'remove_subject',
        resourceType: 'classroom',
        resourceId: cls._id,
        user: req.user,
        details: { subject },
        ip: req.ip,
      });
    } catch {}
    res.json({ message: 'Subject removed', class: cls });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove subject: ' + err.message });
  }
});

// Assign a teacher to a class (admin)
// POST /api/classes/:id/teacher  body: { teacherId }
router.post('/:id/teacher', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { teacherId } = req.body;
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    const cls = await SchoolClassroom.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    cls.teacherId = teacherId;
    await cls.save();
    res.json({ message: 'Teacher assigned', class: cls });
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign teacher: ' + err.message });
  }
});

// Add a student to class members (admin or teacher)
// POST /api/classes/:id/members  body: { userId }
router.post('/:id/members', verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    const cls = await SchoolClassroom.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    // allow if admin or teacher of this class
    if (req.user.role !== 'admin' && (!cls.teacherId || cls.teacherId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not allowed to add members' });
    }
    if (!cls.members.map((m) => m.toString()).includes(userId)) cls.members.push(userId);
    await cls.save();
    try {
      await logAudit({
        action: 'add_member',
        resourceType: 'classroom',
        resourceId: cls._id,
        user: req.user,
        details: { memberId: userId },
        ip: req.ip,
      });
    } catch {}
    res.json({ message: 'Member added', class: cls });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add member: ' + err.message });
  }
});

// Remove a student from class members (admin or teacher)
// DELETE /api/classes/:id/members/:memberId
router.delete('/:id/members/:memberId', verifyToken, async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const SchoolClassroom = createSchoolClassroom(conn);
    const cls = await SchoolClassroom.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (req.user.role !== 'admin' && (!cls.teacherId || cls.teacherId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not allowed to remove members' });
    }
    cls.members = cls.members.filter((m) => m.toString() !== memberId);
    await cls.save();
    try {
      await logAudit({
        action: 'remove_member',
        resourceType: 'classroom',
        resourceId: cls._id,
        user: req.user,
        details: { memberId },
        ip: req.ip,
      });
    } catch {}
    res.json({ message: 'Member removed', class: cls });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove member: ' + err.message });
  }
});

module.exports = router;
