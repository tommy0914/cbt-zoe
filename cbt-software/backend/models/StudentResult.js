const mongoose = require('mongoose');

const SubjectPerformanceSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    totalTests: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    lowestScore: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    passingRate: { type: Number, default: 0 },
    performanceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'F' },
    testAttempts: [
      {
        testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
        testName: { type: String },
        attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt' },
        score: { type: Number },
        correctAnswers: { type: Number },
        totalQuestions: { type: Number },
        completedAt: { type: Date },
        isPassed: { type: Boolean, default: false },
      }
    ]
  },
  { _id: false }
);

const StudentResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  className: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  
  // Overall Test Performance Metrics
  totalTestsTaken: { type: Number, default: 0 },
  totalScoreObtained: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },
  lowestScore: { type: Number, default: 0 },
  totalQuestionsAttempted: { type: Number, default: 0 },
  totalQuestionsCorrect: { type: Number, default: 0 },
  correctPercentage: { type: Number, default: 0 },
  
  // Overall Test Details
  testAttempts: [
    {
      testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
      testName: { type: String },
      subject: { type: String },
      attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt' },
      score: { type: Number },
      totalQuestions: { type: Number },
      correctAnswers: { type: Number },
      duration: { type: Number }, // in minutes
      completedAt: { type: Date },
      status: { type: String, enum: ['completed', 'attempted', 'failed', 'passed'], default: 'completed' },
      isPassed: { type: Boolean, default: false },
    }
  ],
  
  // Subject-wise Performance
  subjectPerformance: [SubjectPerformanceSchema],
  
  // Additional Stats
  strengthAreas: [{ type: String }], // Subjects where student scored well
  weakAreas: [{ type: String }], // Subjects where student needs improvement
  passingRate: { type: Number, default: 0 }, // % of tests passed
  overallGPA: { type: Number, default: 0 }, // Average of all subject grades
  ranking: { type: Number }, // Position in class
  performanceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'F' }, // Based on average
  
  // Meta
  generatedAt: { type: Date, default: Date.now },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin/Teacher who generated report
  updatedAt: { type: Date, default: Date.now },
  notes: { type: String }, // Optional notes from teacher
});

module.exports = mongoose.model('StudentResult', StudentResultSchema);
