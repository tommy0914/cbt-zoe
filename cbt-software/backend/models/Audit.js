const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  action: { type: String, required: true },
  resourceType: { type: String },
  resourceId: { type: String },
  userId: { type: String },
  username: { type: String },
  role: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Audit', AuditSchema);
