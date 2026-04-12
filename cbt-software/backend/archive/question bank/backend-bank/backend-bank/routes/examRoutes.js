const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Question = require('../models/question');

// Create a new exam (Admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    payload.createdBy = req.user ? req.user.id : undefined;
    const exam = new Exam(payload);
    await exam.save();
    res.status(201).json(exam);
  } catch (err) {
    console.error('Error creating exam:', err);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// List exams: admins get all, users get currently available exams
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user && req.user.role === 'admin') {
      const exams = await Exam.find().sort({ createdAt: -1 });
      return res.json(exams);
    }
    const now = new Date();
    const exams = await Exam.find({ startAt: { $lte: now }, endAt: { $gte: now } }).sort({ startAt: 1 });
    res.json(exams);
  } catch (err) {
    console.error('Error listing exams:', err);
    res.status(500).json({ error: 'Failed to list exams' });
  }
});

// Get exam details (no answers)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questionIds', 'text options topic');
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    console.error('Error fetching exam:', err);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// Start an exam attempt (creates an ExamAttempt and returns questions without answers)
router.post('/:id/start', verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const now = new Date();
    if (exam.startAt && exam.startAt > now) return res.status(403).json({ error: 'Exam has not started yet' });
    if (exam.endAt && exam.endAt < now) return res.status(403).json({ error: 'Exam has ended' });

    // Select questions
    let selectedQuestions = [];
    if (exam.selectionType === 'manual' && Array.isArray(exam.questionIds) && exam.questionIds.length > 0) {
      selectedQuestions = await Question.find({ _id: { $in: exam.questionIds } }).select('text options topic');
    } else {
      // Random selection based on subjectIds and/or classIds
      const match = {};
      if (exam.subjectIds && exam.subjectIds.length > 0) match.subjectId = { $in: exam.subjectIds };
      if (exam.classIds && exam.classIds.length > 0) match.classId = { $in: exam.classIds };
      const count = Math.max(1, exam.questionCount || 10);
      if (Object.keys(match).length === 0) {
        // sample from all questions
        selectedQuestions = await Question.aggregate([{ $sample: { size: Math.min(count, 200) } }]);
      } else {
        selectedQuestions = await Question.aggregate([
          { $match: match },
          { $sample: { size: Math.min(count, 200) } }
        ]);
      }
      // After aggregate, docs are plain objects; ensure fields exist
      selectedQuestions = selectedQuestions.map(q => ({ _id: q._id, text: q.text, options: q.options, topic: q.topic }));
    }

    // Optionally shuffle
    if (exam.randomized) {
      for (let i = selectedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
      }
    }

    // Create attempt record with blank answers
    const attempt = new ExamAttempt({
      examId: exam._id,
      userId: req.user.id,
      startedAt: new Date(),
      answers: selectedQuestions.map(q => ({ questionId: q._id }))
    });
    await attempt.save();

    // Return attempt id and questions (without the correct answer)
    res.json({ attemptId: attempt._id, exam: { id: exam._id, title: exam.title, durationMinutes: exam.durationMinutes }, questions: selectedQuestions });
  } catch (err) {
    console.error('Error starting exam:', err);
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

// Submit an attempt
// Body: { attemptId, answers: [{ questionId, answer }] }
router.post('/:id/submit', verifyToken, async (req, res) => {
  try {
    const { attemptId, answers } = req.body;
    if (!attemptId || !Array.isArray(answers)) return res.status(400).json({ error: 'attemptId and answers are required' });

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (String(attempt.userId) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed to submit this attempt' });
    if (attempt.isSubmitted) return res.status(400).json({ error: 'Attempt already submitted' });

    // Load questions to grade
    const qIds = answers.map(a => mongoose.Types.ObjectId(a.questionId));
    const questions = await Question.find({ _id: { $in: qIds } });
    const qMap = {};
    questions.forEach(q => { qMap[String(q._id)] = q; });

    let correct = 0;
    const gradedAnswers = answers.map(a => {
      const q = qMap[String(a.questionId)];
      const isCorrect = q ? String(a.answer).trim() === String(q.answer).trim() : false;
      if (isCorrect) correct++;
      return { questionId: a.questionId, answer: a.answer, isCorrect };
    });

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    attempt.answers = gradedAnswers;
    attempt.submittedAt = new Date();
    attempt.timeTakenSeconds = Math.max(0, Math.floor((attempt.submittedAt - attempt.startedAt) / 1000));
    attempt.score = score;
    attempt.isSubmitted = true;
    attempt.graded = true;
    await attempt.save();

    res.json({ message: 'Attempt submitted', score, total: questions.length, correct });
  } catch (err) {
    console.error('Error submitting attempt:', err);
    res.status(500).json({ error: 'Failed to submit attempt' });
  }
});

// Admin: get attempts for an exam
router.get('/:id/attempts', verifyToken, requireAdmin, async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ examId: req.params.id }).populate('userId', 'username role').sort({ submittedAt: -1 });
    res.json(attempts);
  } catch (err) {
    console.error('Error fetching attempts:', err);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

module.exports = router;
