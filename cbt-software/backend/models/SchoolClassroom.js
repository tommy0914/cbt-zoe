const mongoose = require('mongoose');

module.exports = function (conn) {
  const ClassroomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subjects: { type: [String], default: [] },
    teacherId: { type: String },
    members: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  });

  try {
    return conn.model('Classroom');
  } catch (_error) {
    return conn.model('Classroom', ClassroomSchema);
  }
};
