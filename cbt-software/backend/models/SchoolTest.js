const mongoose = require('mongoose');

module.exports = function (conn) {
  const QuestionDistributionSchema = new mongoose.Schema(
    { subject: { type: String, required: true }, count: { type: Number, required: true } },
    { _id: false },
  );
  const TestSchema = new mongoose.Schema({
    testName: { type: String, required: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    passScorePercentage: { type: Number, required: true, default: 50 },
    questionDistribution: { type: [QuestionDistributionSchema], default: [] },
    availableFrom: { type: Date, default: null },
    availableUntil: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  });

  try {
    return conn.model('Test');
  } catch (_error) {
    return conn.model('Test', TestSchema);
  }
};
