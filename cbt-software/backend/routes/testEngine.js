const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth').verifyToken;
const requireRole = require('../middleware/auth').requireRole;
const { getConnection } = require('../utils/dbManager');
const School = require('../models/School');
const createQuestionModel = require('../models/Question');
const createTestModel = require('../models/Test');
const createAttemptModel = require('../models/Attempt');

// Middleware to establish school DB connection based on user's schoolId
const bindSchoolDb = async (req, res, next) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Missing schoolId in user context' });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const conn = await getConnection(school.dbName);
    
    // Attach models to the request for easy access in handlers
    req.models = {
      Question: createQuestionModel(conn),
      Test: createTestModel(conn),
      Attempt: createAttemptModel(conn)
    };
    
    next();
  } catch (error) {
    console.error('Error binding school DB:', error);
    res.status(500).json({ message: 'Database connection error' });
  }
};

// --- Test Builder APIs (Teacher/Admin) ---

// Create a new test and its questions
router.post('/create', verifyToken, requireRole(['teacher', 'admin', 'superAdmin']), bindSchoolDb, async (req, res) => {
  try {
    const { title, description, durationMinutes, classId, questions, shuffleQuestions, showAnswerAfterSubmit } = req.body;
    const { Question, Test } = req.models;

    if (!title || !durationMinutes || !classId) {
      return res.status(400).json({ message: 'Title, durationMinutes, and classId are required.' });
    }

    // 1. Create questions first
    const questionDocs = [];
    if (questions && questions.length > 0) {
      for (const qData of questions) {
        const q = new Question({
          ...qData,
          createdBy: req.user._id
        });
        await q.save();
        questionDocs.push(q._id);
      }
    }

    // 2. Create the test
    const newTest = new Test({
      title,
      description,
      durationMinutes,
      classId,
      shuffleQuestions,
      showAnswerAfterSubmit,
      questions: questionDocs,
      createdBy: req.user._id
    });

    await newTest.save();

    res.status(201).json({ message: 'Test created successfully', test: newTest });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ message: 'Failed to create test', error: error.message });
  }
});

// List all tests for a specific class (Student/Teacher/Admin)
router.get('/class/:classId', verifyToken, bindSchoolDb, async (req, res) => {
  try {
    const { classId } = req.params;
    const { Test } = req.models;

    const tests = await Test.find({ classId }).sort({ createdAt: -1 });
    res.status(200).json({ tests });
  } catch (error) {
    console.error('Error fetching tests for class:', error);
    res.status(500).json({ message: 'Failed to fetch tests' });
  }
});

// Get detailed test including populated questions
router.get('/:id', verifyToken, bindSchoolDb, async (req, res) => {
  try {
    const { Test } = req.models;
    const test = await Test.findById(req.params.id).populate('questions');
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.status(200).json({ test });
  } catch (error) {
    console.error('Error fetching test details:', error);
    res.status(500).json({ message: 'Failed to fetch test details' });
  }
});


// --- Test Taking APIs (Student) ---

// Start a test attempt
router.post('/:id/start', verifyToken, bindSchoolDb, async (req, res) => {
  try {
    const { Attempt } = req.models;
    const testId = req.params.id;
    const studentId = req.user._id;

    // Check if an attempt already exists
    const existingAttempt = await Attempt.findOne({ testId, studentId, status: 'in_progress' });
    if (existingAttempt) {
      return res.status(200).json({ message: 'Resuming existing attempt', attempt: existingAttempt });
    }

    const newAttempt = new Attempt({
      studentId,
      testId,
      status: 'in_progress'
    });

    await newAttempt.save();
    
    res.status(201).json({ message: 'Test started', attempt: newAttempt });
  } catch (error) {
    console.error('Error starting test attempt:', error);
    res.status(500).json({ message: 'Failed to start test' });
  }
});

// Save test progress (Auto-save)
router.patch('/:id/save-progress', verifyToken, bindSchoolDb, async (req, res) => {
  try {
    const { Attempt } = req.models;
    const testId = req.params.id;
    const studentId = req.user._id;
    const { responses } = req.body;

    const attempt = await Attempt.findOne({ testId, studentId, status: 'in_progress' });
    if (!attempt) {
      return res.status(404).json({ message: 'No active attempt found' });
    }

    attempt.responses = responses || [];
    await attempt.save();

    res.status(200).json({ message: 'Progress saved' });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ message: 'Failed to save progress' });
  }
});

// Submit a test attempt (Auto-Grading)
router.post('/:id/submit', verifyToken, bindSchoolDb, async (req, res) => {
  try {
    const { Attempt, Question } = req.models;
    const testId = req.params.id;
    const studentId = req.user._id;
    const { responses } = req.body; // Array of { questionId, answer }

    const attempt = await Attempt.findOne({ testId, studentId, status: 'in_progress' });
    if (!attempt) {
      return res.status(404).json({ message: 'No active attempt found for this test.' });
    }

    let totalScore = 0;
    const gradedResponses = [];

    // Auto-grade multiple choice / true-false questions
    for (const resData of responses) {
      const question = await Question.findById(resData.questionId);
      if (!question) continue;

      let isCorrect = false;
      let pointsAwarded = 0;

      // Simple exact match logic for objective questions
      if (['multiple_choice', 'true_false'].includes(question.type)) {
        if (question.correctAnswer.toLowerCase().trim() === resData.answer.toLowerCase().trim()) {
          isCorrect = true;
          pointsAwarded = question.points || 1;
          totalScore += pointsAwarded;
        }
      }

      gradedResponses.push({
        questionId: question._id,
        answer: resData.answer,
        isCorrect,
        pointsAwarded
      });
    }

    // Update the attempt
    attempt.responses = gradedResponses;
    attempt.totalScore = totalScore;
    attempt.submitTime = new Date();
    attempt.status = 'submitted'; // the pre-save hook will automatically calculate `percentage` and change status to `graded` if appropriate

    await attempt.save();

    res.status(200).json({ 
      message: 'Test submitted successfully', 
      attempt: {
        score: attempt.totalScore,
        percentage: attempt.percentage,
        status: attempt.status
      }
    });

  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Failed to submit test' });
  }
});

module.exports = router;
