const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const SchoolMembershipSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true }, // sparse allows multiple null values
  googleId: { type: String, unique: true, sparse: true },
  password: { type: String }, // Not required for OAuth users
  schools: [SchoolMembershipSchema],
  createdAt: { type: Date, default: Date.now },
});

// Use an async pre-save hook
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new) and exists
  if (this.isModified('password') && this.password) {
    try {
      const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
      this.password = hash;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
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
