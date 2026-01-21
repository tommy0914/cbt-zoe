const mongoose = require('mongoose');
const { Schema } = mongoose;

const certificateSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: 'School'
  },
  studentName: String,
  studentEmail: String,
  testTitle: String,
  score: Number,
  totalMarks: Number,
  percentage: Number,
  certificateNumber: {
    type: String,
    unique: true // e.g., CERT-2026-001234
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: null
  },
  certificateUrl: String, // URL to generated PDF
  template: {
    type: String,
    enum: ['standard', 'gold', 'platinum'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['pending', 'generated', 'sent'],
    default: 'pending'
  },
  sentAt: Date,
  metadata: {
    courseCode: String,
    instructor: String,
    institution: String
  }
});

certificateSchema.pre('save', async function(next) {
  if (this.isNew && !this.certificateNumber) {
    const count = await mongoose.model('Certificate').countDocuments();
    const year = new Date().getFullYear();
    this.certificateNumber = `CERT-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
