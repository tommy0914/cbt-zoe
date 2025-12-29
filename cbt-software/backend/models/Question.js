const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true, // The question cannot be empty
  },
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
  subject: {
    type: String,
    default: 'General', // Optional: Helps group questions (Math, English, etc.)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
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

module.exports = mongoose.model('Question', QuestionSchema);
