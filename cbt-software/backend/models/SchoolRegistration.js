const mongoose = require('mongoose');

const schoolRegistrationSchema = new mongoose.Schema({
  schoolName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SchoolRegistration', schoolRegistrationSchema);
