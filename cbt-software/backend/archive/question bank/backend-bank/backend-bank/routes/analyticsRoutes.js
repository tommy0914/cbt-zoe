const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Question = require('../models/question');

// GET /api/exams/:id/analytics
// Returns exam summary: totalAttempts, avgScore, passRate, medianTime, recentAttempts
router.get('/exams/:id/analytics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const examId = req.params.id;
    const attempts = await ExamAttempt.find({ examId: mongoose.Types.ObjectId(examId), isSubmitted: true });
    const total = attempts.length;
    const avgScore = total > 0 ? (attempts.reduce((s, a) => s + (a.score || 0), 0) / total) : 0;
    const passCount = attempts.filter(a => (a.score || 0) >= 70).length;
    const passRate = total > 0 ? (passCount / total) * 100 : 0;
    const times = attempts.map(a => a.timeTakenSeconds || 0).sort((a,b)=>a-b);
    let medianTime = 0;
    if (times.length > 0) {
      const mid = Math.floor(times.length / 2);
      medianTime = times.length % 2 === 1 ? times[mid] : (times[mid-1] + times[mid]) / 2;
    }
    const recentAttempts = attempts.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0,10).map(a => ({ id: a._id, userId: a.userId, score: a.score, submittedAt: a.submittedAt }));

    res.json({ examId, totalAttempts: total, avgScore: Number(avgScore.toFixed(2)), passRate: Number(passRate.toFixed(2)), medianTimeSeconds: medianTime, recentAttempts });
  } catch (err) {
    console.error('Error in exam analytics:', err);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

// GET /api/analytics/students/:studentId
// Returns student's attempt history (self or admin)
router.get('/students/:studentId', verifyToken, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    // allow admin or the student themselves
    if (req.user.role !== 'admin' && String(req.user.id) !== String(studentId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const attempts = await ExamAttempt.find({ userId: mongoose.Types.ObjectId(studentId), isSubmitted: true }).populate('examId', 'title').sort({ submittedAt: -1 });
    const history = attempts.map(a => ({ examId: a.examId?._id || null, examTitle: a.examId?.title || '', score: a.score, submittedAt: a.submittedAt, timeTakenSeconds: a.timeTakenSeconds }));
    res.json({ studentId, history });
  } catch (err) {
    console.error('Error fetching student history:', err);
    res.status(500).json({ error: 'Failed to fetch student history' });
  }
});

// GET /api/exams/:id/time
// Approximate time-on-question by averaging timeTakenSeconds / numAnswers across attempts
router.get('/exams/:id/time', verifyToken, requireAdmin, async (req, res) => {
  try {
    const examId = req.params.id;
    const attempts = await ExamAttempt.find({ examId: mongoose.Types.ObjectId(examId), isSubmitted: true });
    const perAttempt = attempts.map(a => {
      const num = Array.isArray(a.answers) ? a.answers.length : 0;
      const time = a.timeTakenSeconds || 0;
      return num > 0 ? (time / num) : 0;
    });
    const avgPerQuestion = perAttempt.length > 0 ? (perAttempt.reduce((s,t) => s + t, 0) / perAttempt.length) : 0;
    res.json({ examId, averageTimePerQuestionSeconds: Number(avgPerQuestion.toFixed(2)), samples: perAttempt.slice(0,200) });
  } catch (err) {
    console.error('Error computing time analysis:', err);
    res.status(500).json({ error: 'Failed to compute time analysis' });
  }
});

// GET /api/analytics/export/exam/:id
// Export analytics for an exam as XLSX (Summary + Item Analysis)
router.get('/export/exam/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const examId = req.params.id;
    // Summary
    const attempts = await ExamAttempt.find({ examId: mongoose.Types.ObjectId(examId), isSubmitted: true });
    const total = attempts.length;
    const avgScore = total > 0 ? (attempts.reduce((s, a) => s + (a.score || 0), 0) / total) : 0;
    const passCount = attempts.filter(a => (a.score || 0) >= 70).length;
    const passRate = total > 0 ? (passCount / total) * 100 : 0;

    const summaryRows = [
      ['Exam ID', examId],
      ['Total Attempts', total],
      ['Average Score', Number(avgScore.toFixed(2))],
      ['Pass Rate (%)', Number(passRate.toFixed(2))]
    ];

    // Item analysis: aggregate answers across attempts
    const agg = await ExamAttempt.aggregate([
      { $match: { examId: mongoose.Types.ObjectId(examId), isSubmitted: true } },
      { $unwind: '$answers' },
      { $group: { _id: '$answers.questionId', totalAttempts: { $sum: 1 }, correctCount: { $sum: { $cond: [ '$answers.isCorrect', 1, 0 ] } }, answers: { $push: '$answers.answer' } } },
      { $sort: { totalAttempts: -1 } },
      { $limit: 200 }
    ]);

    // Resolve question text
    const qIds = agg.map(a => a._id).filter(Boolean);
    const questions = await Question.find({ _id: { $in: qIds } }).select('text options answer');
    const qMap = {};
    questions.forEach(q => { qMap[String(q._id)] = q; });

    const itemRows = [['Question ID', 'Text', 'Total Attempts', 'Correct Count', 'Difficulty (%)']];
    agg.forEach(a => {
      const q = qMap[String(a._id)] || {};
      const difficulty = a.totalAttempts > 0 ? (a.correctCount / a.totalAttempts) * 100 : 0;
      itemRows.push([String(a._id), q.text || '', a.totalAttempts, a.correctCount, Number(difficulty.toFixed(2))]);
    });

    const wb = xlsx.utils.book_new();
    const wsSummary = xlsx.utils.aoa_to_sheet(summaryRows);
    const wsItems = xlsx.utils.aoa_to_sheet(itemRows);
    xlsx.utils.book_append_sheet(wb, wsSummary, 'Summary');
    xlsx.utils.book_append_sheet(wb, wsItems, 'ItemAnalysis');

    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="exam_${examId}_analytics.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('Error exporting exam analytics:', err);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

// GET /api/analytics/questions/health
// Returns basic item bank health metrics: usage and difficulty by question and by subject
router.get('/questions/health', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Aggregate attempts by question
    const agg = await ExamAttempt.aggregate([
      { $match: { isSubmitted: true } },
      { $unwind: '$answers' },
      { $group: { _id: '$answers.questionId', totalAttempts: { $sum: 1 }, correctCount: { $sum: { $cond: [ '$answers.isCorrect', 1, 0 ] } } } },
      { $sort: { totalAttempts: -1 } },
      { $limit: 1000 }
    ]);

    const qIds = agg.map(a => a._id).filter(Boolean);
    const questions = await Question.find({ _id: { $in: qIds } }).select('text subjectId topic');
    const qMap = {};
    questions.forEach(q => { qMap[String(q._id)] = q; });

    const results = agg.map(a => {
      const q = qMap[String(a._id)] || {};
      const difficulty = a.totalAttempts > 0 ? (a.correctCount / a.totalAttempts) * 100 : 0;
      return { questionId: String(a._id), text: q.text || '', subjectId: q.subjectId || null, topic: q.topic || '', totalAttempts: a.totalAttempts, correctCount: a.correctCount, difficulty: Number(difficulty.toFixed(2)) };
    });

    // Questions per subject
    const perSubject = {};
    results.forEach(r => {
      const sid = r.subjectId ? String(r.subjectId) : 'unknown';
      if (!perSubject[sid]) perSubject[sid] = { subjectId: sid, count: 0, avgDifficulty: 0, totalAttempts: 0 };
      perSubject[sid].count += 1;
      perSubject[sid].avgDifficulty = ((perSubject[sid].avgDifficulty * (perSubject[sid].count - 1)) + r.difficulty) / perSubject[sid].count;
      perSubject[sid].totalAttempts += r.totalAttempts;
    });

    res.json({ questions: results, perSubject: Object.values(perSubject) });
  } catch (err) {
    console.error('Error computing question health:', err);
    res.status(500).json({ error: 'Failed to compute question health' });
  }
});

module.exports = router;

// GET /api/analytics/exams/:id/items
// Returns per-question statistics for an exam: totalAttempts, correctCount, difficulty, optionCounts
router.get('/exams/:id/items', verifyToken, requireAdmin, async (req, res) => {
  try {
    const examId = req.params.id;
    const limit = parseInt(String(req.query.limit || '100'), 10);
    const page = Math.max(0, parseInt(String(req.query.page || '0'), 10));

    const matchStage = { examId: mongoose.Types.ObjectId(examId), isSubmitted: true };

    const agg = await ExamAttempt.aggregate([
      { $match: matchStage },
      { $unwind: '$answers' },
      { $group: { _id: { qId: '$answers.questionId', ans: '$answers.answer' }, count: { $sum: 1 }, correctCount: { $sum: { $cond: [ '$answers.isCorrect', 1, 0 ] } } } },
      { $group: { _id: '$_id.qId', totalAttempts: { $sum: '$count' }, correctCount: { $sum: '$correctCount' }, options: { $push: { answer: '$_id.ans', count: '$count' } } } },
      { $sort: { totalAttempts: -1 } },
      { $skip: page * limit },
      { $limit: limit }
    ]);

    const qIds = agg.map(a => a._id).filter(Boolean);
    const questions = await Question.find({ _id: { $in: qIds } }).select('text options answer');
    const qMap = {};
    questions.forEach(q => { qMap[String(q._id)] = q; });

    const results = agg.map(a => {
      const q = qMap[String(a._id)] || {};
      const difficulty = a.totalAttempts > 0 ? (a.correctCount / a.totalAttempts) * 100 : 0;
      return {
        questionId: String(a._id),
        text: q.text || '',
        options: q.options || [],
        totalAttempts: a.totalAttempts,
        correctCount: a.correctCount,
        difficulty: Number(difficulty.toFixed(2)),
        optionCounts: (a.options || []).map(o => ({ answer: o.answer, count: o.count }))
      };
    });

    res.json({ items: results, page, limit });
  } catch (err) {
    console.error('Error fetching exam items analytics:', err);
    res.status(500).json({ error: 'Failed to fetch items analytics' });
  }
});

