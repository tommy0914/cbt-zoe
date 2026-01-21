const mongoose = require('mongoose');
const { Schema } = mongoose;

const leaderboardSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: 'School'
  },
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    default: null // null for overall class leaderboard
  },
  studentName: String,
  studentEmail: String,
  totalScore: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  testsAttempted: {
    type: Number,
    default: 0
  },
  passCount: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0 // For gamification
  },
  rank: {
    type: Number,
    default: null
  },
  streak: {
    type: Number,
    default: 0 // Consecutive correct answers
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
leaderboardSchema.index({ classId: 1, averageScore: -1 });
leaderboardSchema.index({ testId: 1, totalScore: -1 });
leaderboardSchema.index({ points: -1 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
