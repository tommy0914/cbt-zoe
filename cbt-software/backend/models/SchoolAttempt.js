const mongoose = require('mongoose');

module.exports = function (conn) {
  const UserAnswerSchema = new mongoose.Schema(
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      selectedAnswer: { type: String },
      grade: { type: Number, default: null },
      gradedBy: { type: String, default: null },
    },
    { _id: false },
  );

  const AttemptSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId },
    subject: { type: String },
    score: { type: Number, default: 0 },
    userAnswers: { type: [UserAnswerSchema], default: [] },
    questions: { type: [{ type: mongoose.Schema.Types.ObjectId }], default: [] },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    isPassed: { type: Boolean, default: false },
    isPractice: { type: Boolean, default: false },
  });

  try {
    return conn.model('Attempt');
  } catch (_error) {
    return conn.model('Attempt', AttemptSchema);
  }
};
