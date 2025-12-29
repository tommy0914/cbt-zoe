const mongoose = require('mongoose');

module.exports = function (conn) {
  const QuestionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'fill-in-the-blank', 'essay'],
      default: 'multiple-choice',
      required: true,
    },
    options: {
      type: [String],
      default: undefined,
    },
    correctAnswer: {
      type: String,
      default: undefined,
    },
    subject: { type: String, default: 'General' },
    createdAt: { type: Date, default: Date.now },
  });

  QuestionSchema.path('options').validate(function (value) {
    if (this.questionType === 'multiple-choice' || this.questionType === 'true-false') {
      return value && value.length > 0;
    }
    return true;
  }, 'Options are required for multiple-choice and true-false questions.');

  QuestionSchema.path('correctAnswer').validate(function (value) {
    if (this.questionType !== 'essay') {
      return value !== undefined && value !== null && value !== '';
    }
    return true;
  }, 'Correct answer is required for all question types except essay.');

  try {
    return conn.model('Question');
  } catch (_error) {
    return conn.model('Question', QuestionSchema);
  }
};
