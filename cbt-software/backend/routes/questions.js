const express = require('express');
const router = express.Router();
const multer = require('multer'); // For handling file uploads
const xlsx = require('xlsx'); // For reading Excel files
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');
const { logAudit } = require('../services/auditLogger');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createSchoolQuestion = require('../models/SchoolQuestion');

// --- MULTER SETUP ---
// Configuration to store the file temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
});

// Middleware to find question by ID (used for GET one, PUT, and DELETE)
async function getQuestion(req, res, next) {
  try {
    // Determine school DB: prefer req.user.schoolId, fall back to query param
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) return res.status(400).json({ message: 'schoolId required to fetch question' });
    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const Question = createSchoolQuestion(conn);
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Cannot find question' });
    res.question = question;
    next();
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(400).json({ message: 'Invalid Question ID format' });
    return res.status(500).json({ message: err.message });
  }
}

// =======================================================
// METHOD 1: BULK UPLOAD QUESTIONS (File)
// =======================================================

// @route   POST /api/questions/upload
// @desc    Upload questions from Excel file
// @access  Admin
router.post('/upload', verifyToken, requirePermission('manage_questions'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    // Use per-school Question model
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ message: 'No schoolId associated with user' });
    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const Question = createSchoolQuestion(conn);
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonQuestions = xlsx.utils.sheet_to_json(worksheet);

    const questionsToInsert = [];

    for (const item of jsonQuestions) {
      // Ensure your Excel headers match these keys:
      const newQuestion = new Question({
        questionText: item.Question,
        options: [item['Option A'], item['Option B'], item['Option C'], item['Option D']],
        correctAnswer: item['Correct Answer'],
        subject: item.Subject || 'General',
      });
      questionsToInsert.push(newQuestion);
    }

    const inserted = await Question.insertMany(questionsToInsert);

    // Audit: bulk upload
    try {
      await logAudit({
        action: 'upload_questions',
        resourceType: 'question',
        resourceId: null,
                user: req.user,
                details: { count: inserted.length },
                ip: req.ip,
              });
            } catch {}
                            res.json({ message: 'Successfully uploaded and saved questions!', count: inserted.length });
                  } catch (err) {
                    console.error('Upload error:', err);
                    res.status(500).json({ message: 'Error processing file or saving to database: ' + err.message });
                  }
                });

// =======================================================
// METHOD 2: MANUAL QUESTION ENTRY (JSON POST)
// =======================================================

// @route   POST /api/questions
// @desc    Add a new question (manual entry)
// @access  Admin
router.post('/', verifyToken, requirePermission('manage_questions'), async (req, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ message: 'No schoolId associated with user' });
    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const Question = createSchoolQuestion(conn);

    const newQuestion = new Question({
      questionText: req.body.questionText,
      options: req.body.options,
      correctAnswer: req.body.correctAnswer,
      subject: req.body.subject,
    });

    const savedQuestion = await newQuestion.save();
    try {
      await logAudit({
        action: 'create_question',
        resourceType: 'question',
        resourceId: savedQuestion._id,
        user: req.user,
        details: { subject: savedQuestion.subject },
        ip: req.ip,
      });
    } catch {}
    res.status(201).json(savedQuestion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// =======================================================
// CRUD: READ, UPDATE, DELETE
// =======================================================

// 3. GET (READ ALL)
// @route   GET /api/questions
// @desc    Get all questions
// @access  Public (Admin View)
router.get('/', async (req, res) => {
  try {
    // require schoolId as query param for public listing
    const schoolId = req.query.schoolId;
    if (!schoolId) return res.status(400).json({ message: 'schoolId query required' });
    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const Question = createSchoolQuestion(conn);
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching questions: ' + err.message });
  }
});

// 4. GET (READ ONE)
// @route   GET /api/questions/:id
// @desc    Get a single question
// @access  Public
router.get('/:id', getQuestion, (req, res) => {
  res.json(res.question);
});

// 5. PUT (UPDATE)
// @route   PUT /api/questions/:id
// @desc    Update a specific question
// @access  Admin
router.put('/:id', verifyToken, requireRole('admin'), getQuestion, async (req, res) => {
  // ... (Update logic for questionText, options, correctAnswer, subject)
  if (req.body.questionText != null) {
    res.question.questionText = req.body.questionText;
  }
  if (req.body.options != null) {
    res.question.options = req.body.options;
  }
  if (req.body.correctAnswer != null) {
    res.question.correctAnswer = req.body.correctAnswer;
  }
  if (req.body.subject != null) {
    res.question.subject = req.body.subject;
  }

  try {
    const updatedQuestion = await res.question.save();
    try {
      await logAudit({
        action: 'update_question',
        resourceType: 'question',
        resourceId: updatedQuestion._id,
        user: req.user,
        details: { subject: updatedQuestion.subject },
        ip: req.ip,
      });
    } catch {}
    res.json(updatedQuestion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 6. DELETE (DELETE)
// @route   DELETE /api/questions/:id
// @desc    Delete a specific question
// @access  Admin
router.delete('/:id', verifyToken, requirePermission('manage_questions'), getQuestion, async (req, res) => {
  try {
    // delete using the question model on the correct school DB
    const schoolId = req.user?.schoolId || req.query.schoolId;
    const school = await School.findById(schoolId);
    const conn = await getConnection(school.dbName);
    const Question = createSchoolQuestion(conn);
    await Question.deleteOne({ _id: req.params.id });
    try {
      await logAudit({
        action: 'delete_question',
        resourceType: 'question',
        resourceId: req.params.id,
        user: req.user,
        ip: req.ip,
      });
    } catch (_e) {}
    res.json({ message: 'Successfully deleted question' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
