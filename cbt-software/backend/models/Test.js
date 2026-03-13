const mongoose = require('mongoose');

// Export a factory that returns a Test model bound to the provided connection
module.exports = function (conn) {
  const schema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    durationMinutes: { type: Number, required: true }, // Time limit for the test
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    
    // Test configuration
    shuffleQuestions: { type: Boolean, default: false },
    showAnswerAfterSubmit: { type: Boolean, default: true },
    
    // References
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // Array of Question IDs
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Scheduling
    scheduledDate: { type: Date },
    scheduledEndDate: { type: Date },
    
    createdAt: { type: Date, default: Date.now },
  });

  // Automatically calculate total marks before saving
  schema.pre('save', async function (next) {
    if (this.isModified('questions')) {
      try {
        const Question = conn.model('Question');
        const questions = await Question.find({ _id: { $in: this.questions } });
        this.totalMarks = questions.reduce((sum, q) => sum + (q.points || 1), 0);
      } catch (err) {
        console.error('Error calculating totalmarks:', err);
      }
    }
    next();
  });

  // Avoid model overwrite error: check existing model on this connection
  try {
    return conn.model('Test');
  } catch (_error) {
    return conn.model('Test', schema);
  }
};
