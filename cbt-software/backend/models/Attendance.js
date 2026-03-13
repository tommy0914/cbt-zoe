const mongoose = require('mongoose');

module.exports = function (conn) {
  const AttendanceRecordSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
    note: { type: String }
  }, { _id: false });

  const AttendanceSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    records: [AttendanceRecordSchema],
    takenBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  // Ensure one attendance document per class per day
  AttendanceSchema.index({ classId: 1, date: 1 }, { unique: true });

  try {
    return conn.model('Attendance');
  } catch (err) {
    return conn.model('Attendance', AttendanceSchema);
  }
};
