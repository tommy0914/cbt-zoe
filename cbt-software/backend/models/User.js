const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const SchoolMembershipSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: false }, // Allow null for global admins
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true }, // sparse allows multiple null values
  password: { type: String, required: true },
  schools: [SchoolMembershipSchema],
  mustChangePassword: { type: Boolean, default: false }, // Flag for first-time password change
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Add a compound index on schools for efficient querying
UserSchema.index({ 'schools.schoolId': 1, 'schools.role': 1 });

// Use an async pre-save hook
UserSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new) and exists
  if (this.isModified('password') && this.password) {
    const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hash;
  }
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  // Ensure password exists before trying to compare
  if (!this.password) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
