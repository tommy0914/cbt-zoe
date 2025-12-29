// backend/routes/test.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../services/auditLogger');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createSchoolQuestion = require('../models/SchoolQuestion');
const createSchoolTest = require('../models/SchoolTest');
const createSchoolAttempt = require('../models/SchoolAttempt');
const createSchoolClassroom = require('../models/SchoolClassroom');

// GET /api/tests/list
// Returns available tests (requires authentication)
router.get('/list', verifyToken, async (req, res) => {
  try {
    // use per-school Test model
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const TestModel = createSchoolTest(conn);
    const tests = await TestModel.find().select('testName durationMinutes passScorePercentage questionDistribution');
    res.json({ tests });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tests: ' + err.message });
  }
});

// GET /api/tests
// Return all tests (requires authentication)
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20);
    const skip = (page - 1) * pageSize;

    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const TestModel = createSchoolTest(conn);

    const filter = {}; // reserved for future filters
    const total = await TestModel.countDocuments(filter);
    const tests = await TestModel.find(filter)
      .select('testName durationMinutes passScorePercentage questionDistribution')
      .skip(skip)
      .limit(pageSize);

    res.json({ tests, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tests: ' + err.message });
  }
});

// GET /api/tests/:id
// Return a single test config by id (requires authentication)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const TestModel = createSchoolTest(conn);
    const test = await TestModel.findById(req.params.id).select(
      'testName durationMinutes passScorePercentage questionDistribution',
    );
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json({ test });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch test: ' + err.message });
  }
});

// Seed info: returns latest test created (helpful after seeding)
router.get('/seed-info/latest', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId; // Use schoolId from req.user
    if (!schoolId) return res.status(400).json({ message: 'School ID is required' });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const TestModel = createSchoolTest(conn);

    const test = await TestModel.findOne().sort({ createdAt: -1 }).select('testName');
    if (!test) return res.status(404).json({ message: 'No test found' });
    res.json({ testId: test._id, testName: test.testName });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch seed info: ' + err.message });
  }
});

// Public search endpoint: GET /api/tests/search?subject=&name=&page=&pageSize=
// Allows filtering by subject and/or name (case-insensitive partial match) and supports pagination
router.get('/search', async (req, res) => {
  try {
    const { subject, name } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20);
    const skip = (page - 1) * pageSize;

    const schoolId = req.query.schoolId; // Assume schoolId is provided for public search
    if (!schoolId) return res.status(400).json({ message: 'School ID is required for public search' });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const conn = await getConnection(school.dbName);
    const TestModel = createSchoolTest(conn);

    const filter = {};
    if (subject) filter['questionDistribution.subject'] = { $regex: new RegExp(subject, 'i') };
    if (name) filter['testName'] = { $regex: new RegExp(name, 'i') };

    // If no filters provided, return a small default paginated set to avoid exposing everything
    const effectiveFilter = Object.keys(filter).length ? filter : {};

    const total = await TestModel.countDocuments(effectiveFilter);
    const tests = await TestModel.find(effectiveFilter)
      .select('testName durationMinutes passScorePercentage questionDistribution')
      .skip(skip)
      .limit(pageSize);

    res.json({ tests, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ message: 'Search failed: ' + err.message });
  }
});

// GET /api/tests/start/:testId
// Starts a test for a student: requires classId and subject query params, selects random questions per distribution and creates an Attempt record with startTime.
router.get('/start/:testId', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const TestModel = createSchoolTest(conn);
    const QuestionModel = createSchoolQuestion(conn);
    const ClassroomModel = createSchoolClassroom(conn);
    const AttemptModel = createSchoolAttempt(conn);

    const test = await TestModel.findById(req.params.testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    // Check if the test is available
    const now = new Date();
    if (test.availableFrom && now < test.availableFrom) {
      return res.status(403).json({ message: 'This test is not yet available.' });
    }
    if (test.availableUntil && now > test.availableUntil) {
      return res.status(403).json({ message: 'This test is no longer available.' });
    }

    const classId = req.query.classId;
    const requestedSubject = req.query.subject;
    const isPractice = req.query.isPractice === 'true';

    if (!classId || !requestedSubject) {
      return res.status(400).json({ message: 'classId and subject query parameters are required' });
    }

    const classroom = await ClassroomModel.findById(classId);
    if (!classroom) return res.status(404).json({ message: 'Class not found' });

    // Ensure the requested subject is part of the classroom's subjects
    const subjectExists = (classroom.subjects || []).some((s) => s.toLowerCase() === requestedSubject.toLowerCase());
    if (!subjectExists) return res.status(400).json({ message: 'Selected subject is not part of the chosen class' });

    // Ensure the student is a member of the class
    const memberIds = (classroom.members || []).map((m) => m.toString());
    if (!memberIds.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Student is not a member of the selected class' });
    }

    // Ensure the test has a distribution entry for the requested subject
    const dist = test.questionDistribution.find((d) => d.subject.toLowerCase() === requestedSubject.toLowerCase());
    if (!dist) return res.status(400).json({ message: 'This test does not contain the selected subject' });

    const count = dist.count || 10;
    const selectedQuestions = await QuestionModel.aggregate([
      { $match: { subject: requestedSubject } },
      { $sample: { size: count } },
    ]);

    if (!selectedQuestions || selectedQuestions.length === 0) {
      return res.status(400).json({ message: 'No questions available for the selected subject' });
    }

    // Create an Attempt record and store the question ids (so correct answers aren't exposed later)
    const questionIds = selectedQuestions.map((q) => q._id);
    const attempt = new AttemptModel({
      userId: req.user._id.toString(),
      testId: test._id,
      classId: classroom._id,
      subject: requestedSubject,
      questions: questionIds,
      startTime: new Date(),
      isPractice,
    });
    await attempt.save();

    // Audit: student started test
    try {
      await logAudit({
        action: 'start_test',
        resourceType: 'test',
        resourceId: test._id,
        user: req.user,
        ip: req.ip,
      });
    } catch {}

    // Return questions without correctAnswer
    const sanitized = selectedQuestions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      subject: q.subject,
    }));

    res.json({
      attemptId: attempt._id,
      testId: test._id,
      classId: classroom._id,
      subject: requestedSubject,
      durationMinutes: test.durationMinutes,
      questions: sanitized,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start test: ' + err.message });
  }
});

// POST /api/tests/submit
// Body: { attemptId: '...', answers: [ { questionId, selectedAnswer }, ... ] }
router.post('/submit', verifyToken, requireRole('student'), async (req, res) => {
  const { attemptId, answers } = req.body;
  if (!attemptId || !Array.isArray(answers))
    return res.status(400).json({ message: 'attemptId and answers array required' });

  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const AttemptModel = createSchoolAttempt(conn);
    const TestModel = createSchoolTest(conn);
    const QuestionModel = createSchoolQuestion(conn);

    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your attempt' });

    const test = await TestModel.findById(attempt.testId);
    if (!test) return res.status(404).json({ message: 'Associated test not found' });

    // Validate time window
    const now = new Date();
    const allowedUntil = new Date(attempt.startTime.getTime() + test.durationMinutes * 60000);
    if (now > allowedUntil) return res.status(400).json({ message: 'Submission time exceeded the allowed duration' });

    // Score
    const questionIds = attempt.questions.map((id) => id.toString());
    const correctQuestions = await QuestionModel.find({ _id: { $in: questionIds } }).select('correctAnswer');
    const answerMap = correctQuestions.reduce((m, q) => {
      m[q._id.toString()] = q.correctAnswer;
      return m;
    }, {});

    let correctCount = 0;
    const results = [];

    for (const a of answers) {
      const qid = a.questionId;
      const selected = a.selectedAnswer;
      const correct = answerMap[qid];
      const isCorrect = correct && selected === correct;
      if (isCorrect) correctCount++;
      results.push({ questionId: qid, userAnswer: selected, correctAnswer: correct || null, isCorrect });
    }

    const total = answers.length;
    const percentage = total > 0 ? (correctCount / total) * 100 : 0;
    const isPassed = percentage >= test.passScorePercentage;

    attempt.score = correctCount;
    attempt.userAnswers = answers;
    attempt.endTime = new Date();
    attempt.isPassed = isPassed;
    await attempt.save();

    // Audit: student submitted test
    try {
      await logAudit({
        action: 'submit_test',
        resourceType: 'attempt',
        resourceId: attempt._id,
        user: req.user,
        details: { score: correctCount, total, percentage, isPassed },
        ip: req.ip,
      });
    } catch {}

    // If practice mode, return correct answers with the results
    if (attempt.isPractice) {
      res.json({
        score: correctCount,
        total,
        percentage,
        isPassed,
        detailedResults: results,
      });
    } else {
      res.json({
        score: correctCount,
        total,
        percentage,
        isPassed,
        message: 'Test submitted successfully. Results will be available after the test is graded.',
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error submitting test: ' + err.message });
  }
});

// GET /api/attempts/grading
// Returns all attempts with essay questions that need grading.
router.get('/grading', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const AttemptModel = createSchoolAttempt(conn);
    const QuestionModel = createSchoolQuestion(conn);

    // Find attempts that have ungraded essay questions
    const attempts = await AttemptModel.find({ 'userAnswers.grade': null })
      .populate({
        path: 'questions',
        model: QuestionModel,
        match: { questionType: 'essay' },
      })
      .populate({
        path: 'userId',
        model: createSchoolUserModel(conn),
        select: 'username',
      });

    const pendingGrading = attempts.filter(
      (attempt) => attempt.questions.length > 0 && attempt.userAnswers.some((ans) => !ans.grade),
    );

    res.json({ pendingGrading });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attempts for grading: ' + err.message });
  }
});

// POST /api/attempts/grading
// Body: { attemptId, questionId, grade }
router.post('/grading', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  const { attemptId, questionId, grade } = req.body;
  if (!attemptId || !questionId || grade === undefined)
    return res.status(400).json({ message: 'attemptId, questionId, and grade are required' });

  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const AttemptModel = createSchoolAttempt(conn);

    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    const answer = attempt.userAnswers.find((ans) => ans.questionId.toString() === questionId);
    if (!answer) return res.status(404).json({ message: 'Answer not found in this attempt' });

    answer.grade = grade;
    answer.gradedBy = req.user._id;

    // Recalculate score if needed (e.g., if you add the grade to the total score)
    // For now, we just save the grade.

    await attempt.save();

    res.json({ message: 'Grade submitted successfully', attempt });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit grade: ' + err.message });
  }
});

module.exports = router;
