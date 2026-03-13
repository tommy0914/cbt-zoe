const mongoose = require('mongoose');

// Export a factory that returns a Question model bound to the provided connection
module.exports = function (conn) {
  const schema = new mongoose.Schema({
    text: { type: String, required: true },
    type: { type: String, enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'], default: 'multiple_choice' },
    options: [{ type: String }], // Array of choices for multiple choice
    correctAnswer: { type: String, required: true }, // The string value of the correct answer
    points: { type: Number, default: 1 },
    explanation: { type: String }, // Explanation for the correct answer
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    tags: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  });

  // Avoid model overwrite error: check existing model on this connection
  try {
    return conn.model('Question');
  } catch (_error) {
    return conn.model('Question', schema);
  }
};
