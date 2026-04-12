const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExamSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  subjectIds: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
  classIds: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
  questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  selectionType: { type: String, enum: ['manual', 'random'], default: 'manual' },
  questionCount: { type: Number, default: 10 },
  startAt: { type: Date },
  endAt: { type: Date },
  durationMinutes: { type: Number, default: 30 },
  randomized: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', ExamSchema);
