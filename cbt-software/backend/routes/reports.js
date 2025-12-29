const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/reports/overall-performance
router.get('/overall-performance', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const agg = await Attempt.aggregate([{ $group: { _id: null, avgScore: { $avg: '$score' }, count: { $sum: 1 } } }]);
    const data = agg[0] || { avgScore: 0, count: 0 };
    res.json({ averageScore: data.avgScore, attempts: data.count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute overall performance: ' + err.message });
  }
});

// GET /api/reports/user-history/:userId
router.get('/user-history/:userId', verifyToken, async (req, res) => {
  try {
    const requestingUser = req.user;
    const targetUserId = req.params.userId;
    if (requestingUser.role !== 'admin' && requestingUser._id.toString() !== targetUserId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const attempts = await Attempt.find({ userId: targetUserId })
      .populate('testId', 'testName durationMinutes')
      .sort({ startTime: -1 });
    res.json({ attempts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user history: ' + err.message });
  }
});

// GET /api/reports/question-difficulty
// Returns questions with successRate < 0.4
router.get('/question-difficulty', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // The above cannot directly access question.correctAnswer inside $group; instead do lookup
    const agg = await Attempt.aggregate([
      { $unwind: '$userAnswers' },
      { $lookup: { from: 'questions', localField: 'userAnswers.questionId', foreignField: '_id', as: 'question' } },
      { $unwind: '$question' },
      {
        $project: {
          qId: '$userAnswers.questionId',
          selected: '$userAnswers.selectedAnswer',
          correct: '$question.correctAnswer',
        },
      },
      {
        $group: {
          _id: '$qId',
          total: { $sum: 1 },
          correct: { $sum: { $cond: [{ $eq: ['$selected', '$correct'] }, 1, 0] } },
        },
      },
      {
        $project: {
          questionId: '$_id',
          total: 1,
          correct: 1,
          successRate: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$correct', '$total'] }, 0] },
        },
      },
      { $match: { successRate: { $lt: 0.4 } } },
      { $sort: { successRate: 1 } },
    ]);

    // Populate question text for results
    const questionIds = agg.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).select('questionText');
    const qMap = questions.reduce((m, q) => {
      m[q._id.toString()] = q;
      return m;
    }, {});

    const result = agg.map((a) => ({
      questionId: a.questionId,
      questionText: qMap[a.questionId.toString()]?.questionText || '',
      total: a.total,
      correct: a.correct,
      successRate: a.successRate,
    }));

    res.json({ difficultQuestions: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute question difficulty: ' + err.message });
  }
});

// GET /api/reports/class-performance
router.get('/class-performance', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    const conn = await getConnection(school.dbName);
    const AttemptModel = createSchoolAttempt(conn);

    const classPerformance = await AttemptModel.aggregate([
      {
        $group: {
          _id: '$classId',
          avgScore: { $avg: '$score' },
          attempts: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'classrooms',
          localField: '_id',
          foreignField: '_id',
          as: 'class',
        },
      },
      {
        $unwind: '$class',
      },
      {
        $project: {
          classId: '$_id',
          className: '$class.name',
          averageScore: '$avgScore',
          numberOfAttempts: '$attempts',
        },
      },
    ]);

    res.json({ classPerformance });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute class performance: ' + err.message });
  }
});

module.exports = router;
