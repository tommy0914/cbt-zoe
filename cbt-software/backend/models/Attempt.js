const mongoose = require('mongoose');

const UserAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedAnswer: { type: String },
    grade: { type: Number, default: null },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

const AttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  subject: { type: String },
  score: { type: Number, default: 0 },
  userAnswers: { type: [UserAnswerSchema], default: [] },
  questions: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], default: [] },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  isPassed: { type: Boolean, default: false },
  isPractice: { type: Boolean, default: false },
});

module.exports = mongoose.model('Attempt', AttemptSchema);
