const mongoose = require('mongoose');

const ClassroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  subjects: { type: [String], default: [] },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Classroom', ClassroomSchema);
