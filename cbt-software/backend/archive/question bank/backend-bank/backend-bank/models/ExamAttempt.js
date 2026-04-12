const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnswerSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
  answer: { type: String },
  isCorrect: { type: Boolean, default: false }
});

const ExamAttemptSchema = new Schema({
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  answers: [AnswerSchema],
  score: { type: Number, default: 0 },
  timeTakenSeconds: { type: Number, default: 0 },
  isSubmitted: { type: Boolean, default: false },
  graded: { type: Boolean, default: false }
});

module.exports = mongoose.model('ExamAttempt', ExamAttemptSchema);
