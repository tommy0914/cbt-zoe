const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const StudentResult = require('../models/StudentResult');
const ReportCard = require('../models/ReportCard');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Test = require('../models/Test');
const { verifyToken, requireRole } = require('../middleware/auth');
const auditLogger = require('../services/auditLogger');

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

// ============ STUDENT RESULTS GENERATION ============

// POST /api/reports/generate-student-result/:studentId/:classId
// Generate comprehensive result for a student in a specific class
router.post('/generate-student-result/:studentId/:classId', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentId, classId } = req.params;
    const { notes } = req.body;

    // Verify student and classroom exist
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const classroom = await Classroom.findById(classId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Get all attempts for this student in this class
    const attempts = await Attempt.find({
      userId: studentId,
      classId: classId
    }).populate('testId');

    if (attempts.length === 0) {
      return res.status(400).json({ error: 'No test attempts found for this student in this class' });
    }

    // Calculate performance metrics
    let totalTests = attempts.length;
    let totalScore = 0;
    let totalQuestions = 0;
    let correctAnswers = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let passedTests = 0;
    const testAttempts = [];

    attempts.forEach(attempt => {
      const score = attempt.score || 0;
      const questionsInTest = attempt.userAnswers.length;
      const correct = attempt.userAnswers.filter(ua => ua.selectedAnswer).length;

      totalScore += score;
      totalQuestions += questionsInTest;
      highestScore = Math.max(highestScore, score);
      lowestScore = Math.min(lowestScore, score);
      if (attempt.isPassed) passedTests++;

      testAttempts.push({
        testId: attempt.testId._id,
        testName: attempt.testId.testName,
        attemptId: attempt._id,
        score: score,
        totalQuestions: questionsInTest,
        correctAnswers: correct,
        duration: attempt.endTime ? Math.round((attempt.endTime - attempt.startTime) / 60000) : 0,
        completedAt: attempt.endTime,
        status: attempt.isPassed ? 'passed' : 'completed',
        isPassed: attempt.isPassed
      });
    });

    const averageScore = totalScore / totalTests;
    const correctPercentage = totalQuestions > 0 ? (totalQuestions / totalQuestions) * 100 : 0;
    const passingRate = (passedTests / totalTests) * 100;

    // Determine performance grade
    let performanceGrade = 'F';
    if (averageScore >= 90) performanceGrade = 'A';
    else if (averageScore >= 80) performanceGrade = 'B';
    else if (averageScore >= 70) performanceGrade = 'C';
    else if (averageScore >= 60) performanceGrade = 'D';

    // Create or update student result
    let studentResult = await StudentResult.findOne({
      studentId,
      classId,
    });

    if (!studentResult) {
      studentResult = new StudentResult({
        studentId,
        studentName: student.name,
        studentEmail: student.email,
        classId,
        className: classroom.name,
        schoolId: student.schoolId,
      });
    }

    // Update metrics
    studentResult.totalTestsTaken = totalTests;
    studentResult.totalScoreObtained = totalScore;
    studentResult.averageScore = averageScore;
    studentResult.highestScore = highestScore === 0 ? 0 : highestScore;
    studentResult.lowestScore = lowestScore === 100 ? 0 : lowestScore;
    studentResult.totalQuestionsAttempted = totalQuestions;
    studentResult.correctPercentage = correctPercentage;
    studentResult.testAttempts = testAttempts;
    studentResult.passingRate = passingRate;
    studentResult.performanceGrade = performanceGrade;
    studentResult.generatedBy = req.user._id;
    studentResult.updatedAt = new Date();
    if (notes) studentResult.notes = notes;

    await studentResult.save();

    auditLogger.log(req.user.id, `Generated result for student: ${student.name} in class: ${classroom.name}`, req);

    res.status(201).json({
      message: 'Student result generated successfully',
      result: studentResult
    });
  } catch (error) {
    console.error('Error generating student result:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/student-results/:classId
// Get all student results for a class
router.get('/student-results/:classId', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId } = req.params;

    const results = await StudentResult.find({ classId })
      .populate('studentId', 'name email')
      .populate('classId', 'name')
      .sort({ averageScore: -1 });

    res.json({
      totalRecords: results.length,
      results
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/student-result/:resultId
// Get detailed student result
router.get('/student-result/:resultId', verifyToken, async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await StudentResult.findById(resultId)
      .populate('studentId', 'name email')
      .populate('classId', 'name')
      .populate('testAttempts.testId', 'testName')
      .populate('generatedBy', 'name');

    if (!result) {
      return res.status(404).json({ error: 'Student result not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching student result:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/student-result-by-student/:studentId/:classId
// Get result for specific student and class
router.get('/student-result-by-student/:studentId/:classId', verifyToken, async (req, res) => {
  try {
    const { studentId, classId } = req.params;

    const result = await StudentResult.findOne({
      studentId,
      classId
    })
      .populate('studentId', 'name email')
      .populate('classId', 'name')
      .populate('generatedBy', 'name');

    if (!result) {
      return res.status(404).json({ error: 'No result found for this student in this class' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching student result:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/reports/student-result/:resultId
// Update student result notes
router.put('/student-result/:resultId', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { resultId } = req.params;
    const { notes } = req.body;

    const result = await StudentResult.findByIdAndUpdate(
      resultId,
      { notes, updatedAt: new Date() },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: 'Student result not found' });
    }

    auditLogger.log(req.user.id, `Updated notes for student result: ${result._id}`, req);

    res.json({
      message: 'Student result updated successfully',
      result
    });
  } catch (error) {
    console.error('Error updating student result:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reports/student-result/:resultId
// Delete student result
router.delete('/student-result/:resultId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await StudentResult.findByIdAndDelete(resultId);

    if (!result) {
      return res.status(404).json({ error: 'Student result not found' });
    }

    auditLogger.log(req.user.id, `Deleted student result: ${resultId}`, req);

    res.json({
      message: 'Student result deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student result:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ REPORT CARD GENERATION ============

// POST /api/reports/generate-report-card/:studentId/:classId
// Generate comprehensive report card with subject-wise breakdown
router.post('/generate-report-card/:studentId/:classId', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentId, classId } = req.params;
    const { academicTerm, academicYear, studentRoll } = req.body;

    // Get student result first (must exist)
    const studentResult = await StudentResult.findOne({ studentId, classId });
    if (!studentResult) {
      return res.status(400).json({ error: 'Generate student result first before creating report card' });
    }

    // Calculate subject-wise grades
    const subjectGrades = [];
    if (studentResult.subjectPerformance && studentResult.subjectPerformance.length > 0) {
      studentResult.subjectPerformance.forEach(subject => {
        subjectGrades.push({
          subject: subject.subject,
          grade: subject.performanceGrade,
          percentage: subject.averageScore,
          totalTests: subject.totalTests,
          totalMarks: subject.totalTests * 100, // Assuming 100 marks per test
          obtainedMarks: subject.totalTests * subject.averageScore,
          remarks: subject.averageScore >= 60 ? 'Pass' : 'Fail',
          performanceStatus: getPerformanceStatus(subject.averageScore)
        });
      });
    }

    // Calculate test breakdown by subject
    const testBreakdown = [];
    if (studentResult.testAttempts && studentResult.testAttempts.length > 0) {
      const subjectTests = {};
      
      studentResult.testAttempts.forEach(test => {
        const subject = test.subject || 'General';
        if (!subjectTests[subject]) {
          subjectTests[subject] = [];
        }
        subjectTests[subject].push({
          testName: test.testName,
          testId: test.testId,
          date: test.completedAt,
          marksObtained: test.score,
          totalMarks: 100,
          percentage: test.score,
          grade: getGrade(test.score),
          status: test.isPassed ? 'Pass' : 'Fail'
        });
      });

      Object.keys(subjectTests).forEach(subject => {
        testBreakdown.push({
          subject,
          tests: subjectTests[subject]
        });
      });
    }

    // Create or update report card
    let reportCard = await ReportCard.findOne({ studentId, classId, academicTerm, academicYear });
    
    if (!reportCard) {
      reportCard = new ReportCard({
        studentId,
        studentName: studentResult.studentName,
        studentEmail: studentResult.studentEmail,
        classId,
        className: studentResult.className,
        schoolId: studentResult.schoolId,
        studentRoll,
        academicTerm,
        academicYear
      });
    }

    // Update report card data
    reportCard.overallGPA = studentResult.overallGPA || studentResult.averageScore;
    reportCard.overallGrade = studentResult.performanceGrade;
    reportCard.overallRanking = studentResult.ranking;
    reportCard.totalTestsTaken = studentResult.totalTestsTaken;
    reportCard.averagePercentage = studentResult.averageScore;
    reportCard.subjectGrades = subjectGrades;
    reportCard.testBreakdown = testBreakdown;
    reportCard.generatedBy = req.user._id;
    reportCard.updatedAt = new Date();

    await reportCard.save();

    auditLogger.log(req.user.id, `Generated report card for student: ${studentResult.studentName}`, req);

    res.status(201).json({
      message: 'Report card generated successfully',
      reportCard
    });
  } catch (error) {
    console.error('Error generating report card:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/report-card/:reportCardId
// Get detailed report card
router.get('/report-card/:reportCardId', verifyToken, async (req, res) => {
  try {
    const { reportCardId } = req.params;

    const reportCard = await ReportCard.findById(reportCardId)
      .populate('studentId', 'name email')
      .populate('classId', 'name')
      .populate('generatedBy', 'name');

    if (!reportCard) {
      return res.status(404).json({ error: 'Report card not found' });
    }

    res.json(reportCard);
  } catch (error) {
    console.error('Error fetching report card:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/report-cards/:classId
// Get all report cards for a class
router.get('/report-cards/:classId', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicTerm, academicYear } = req.query;

    let query = { classId };
    if (academicTerm) query.academicTerm = academicTerm;
    if (academicYear) query.academicYear = academicYear;

    const reportCards = await ReportCard.find(query)
      .populate('studentId', 'name email')
      .sort({ overallGrade: 1, averagePercentage: -1 });

    res.json({
      totalRecords: reportCards.length,
      reportCards
    });
  } catch (error) {
    console.error('Error fetching report cards:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/subject-performance/:studentId/:classId
// Get subject-wise performance breakdown
router.get('/subject-performance/:studentId/:classId', verifyToken, async (req, res) => {
  try {
    const { studentId, classId } = req.params;

    const studentResult = await StudentResult.findOne({ studentId, classId })
      .populate('testAttempts.testId', 'testName');

    if (!studentResult) {
      return res.status(404).json({ error: 'Student result not found' });
    }

    res.json({
      studentName: studentResult.studentName,
      subjectPerformance: studentResult.subjectPerformance,
      testBreakdown: studentResult.testAttempts
    });
  } catch (error) {
    console.error('Error fetching subject performance:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/reports/report-card/:reportCardId
// Update report card (add remarks, approve, publish)
router.put('/report-card/:reportCardId', verifyToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { reportCardId } = req.params;
    const { principalRemarks, teacherRemarks, isApproved, isPublished } = req.body;

    const reportCard = await ReportCard.findByIdAndUpdate(
      reportCardId,
      {
        principalRemarks,
        teacherRemarks,
        isApproved: isApproved !== undefined ? isApproved : undefined,
        approvedBy: isApproved ? req.user._id : undefined,
        approvedAt: isApproved ? new Date() : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
        publishedAt: isPublished ? new Date() : undefined,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!reportCard) {
      return res.status(404).json({ error: 'Report card not found' });
    }

    auditLogger.log(req.user.id, `Updated report card: ${reportCardId}`, req);

    res.json({
      message: 'Report card updated successfully',
      reportCard
    });
  } catch (error) {
    console.error('Error updating report card:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reports/report-card/:reportCardId
// Delete report card
router.delete('/report-card/:reportCardId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { reportCardId } = req.params;

    const reportCard = await ReportCard.findByIdAndDelete(reportCardId);

    if (!reportCard) {
      return res.status(404).json({ error: 'Report card not found' });
    }

    auditLogger.log(req.user.id, `Deleted report card: ${reportCardId}`, req);

    res.json({
      message: 'Report card deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report card:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate performance status
function getPerformanceStatus(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 45) return 'Below Average';
  return 'Poor';
}

// Helper function to get grade
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

module.exports = router;
