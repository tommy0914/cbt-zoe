const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, requireRole } = require('../middleware/auth');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createSchoolMaterialModel = require('../models/SchoolMaterial');
const { logAudit } = require('../services/auditLogger');

// Configure static uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST /api/materials/upload
// Upload a new study material
router.post('/upload', verifyToken, requireRole(['admin', 'teacher', 'superAdmin']), upload.single('file'), async (req, res) => {
  try {
    const { title, description, classId, subject } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!title || !classId) {
      // Clean up uploaded file if missing required fields
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title and classId are required' });
    }

    const schoolId = req.user.schoolId;
    if (!schoolId) return res.status(400).json({ message: 'School ID missing' });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const MaterialModel = createSchoolMaterialModel(conn);

    const fileUrl = `/uploads/${req.file.filename}`;

    const newMaterial = new MaterialModel({
      title,
      description,
      fileUrl,
      fileName: req.file.originalname,
      classId,
      subject,
      uploadedBy: req.user._id
    });

    await newMaterial.save();

    await logAudit({
      action: 'upload_material',
      resourceType: 'material',
      resourceId: newMaterial._id,
      user: req.user,
      details: { title, classId },
      ip: req.ip,
    }).catch(console.error);

    res.status(201).json({ message: 'Material uploaded successfully', material: newMaterial });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error uploading material', error: err.message });
  }
});

// GET /api/materials/class/:classId
// Get all materials for a specific class
router.get('/class/:classId', verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const schoolId = req.user.schoolId;

    if (!schoolId) return res.status(400).json({ message: 'School ID missing' });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const MaterialModel = createSchoolMaterialModel(conn);

    const materials = await MaterialModel.find({ classId }).sort({ createdAt: -1 });

    res.json({ materials });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching materials', error: err.message });
  }
});

// DELETE /api/materials/:id
// Delete a material
router.delete('/:id', verifyToken, requireRole(['admin', 'teacher', 'superAdmin']), async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) return res.status(400).json({ message: 'School ID missing' });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const MaterialModel = createSchoolMaterialModel(conn);

    const material = await MaterialModel.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Attempt to delete file from disk
    const filePath = path.join(__dirname, '..', material.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await MaterialModel.findByIdAndDelete(req.params.id);

    await logAudit({
      action: 'delete_material',
      resourceType: 'material',
      resourceId: req.params.id,
      user: req.user,
      details: { title: material.title },
      ip: req.ip,
    }).catch(console.error);

    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting material', error: err.message });
  }
});

module.exports = router;
