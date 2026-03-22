const mongoose = require('mongoose');

module.exports = function (conn) {
  const SchoolMaterialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, required: true },
    subject: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  });

  try {
    return conn.model('SchoolMaterial');
  } catch (err) {
    return conn.model('SchoolMaterial', SchoolMaterialSchema);
  }
};
