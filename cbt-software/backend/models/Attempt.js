const mongoose = require('mongoose');

// Export a factory that returns an Attempt model bound to the provided connection
module.exports = function (conn) {
  const schema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolUser', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    
    responses: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      answer: { type: String }, // The student's submitted answer
      isCorrect: { type: Boolean, default: false }, // Useful for auto-grading
      pointsAwarded: { type: Number, default: 0 }
    }],
    
    totalScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    
    startTime: { type: Date, default: Date.now },
    submitTime: { type: Date },
    
    status: { type: String, enum: ['in_progress', 'submitted', 'graded'], default: 'in_progress' },
    feedback: { type: String }, // Optional teacher feedback text
    
    createdAt: { type: Date, default: Date.now },
  });

  // Automatically calculate percentage before saving if submitted
  schema.pre('save', async function (next) {
    if (this.isModified('totalScore') || this.isModified('status')) {
      try {
        const Test = conn.model('Test');
        const test = await Test.findById(this.testId);
        if (test && test.totalMarks > 0) {
          this.percentage = Math.round((this.totalScore / test.totalMarks) * 100);
        }
        
        // Auto mark as graded if submitted and auto-graded
        if (this.status === 'submitted') {
          this.status = 'graded';
        }
      } catch (err) {
        console.error('Error calculating percentage:', err);
      }
    }
    next();
  });

  // Avoid model overwrite error: check existing model on this connection
  try {
    return conn.model('Attempt');
  } catch (_error) {
    return conn.model('Attempt', schema);
  }
};
