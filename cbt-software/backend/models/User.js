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
  
  // Security Fields
  loginAttempts: { type: Number, default: 0 }, // Track failed login attempts
  lockUntil: { type: Date, default: null }, // Account locked until this time
  lastLogin: { type: Date, default: null }, // Last successful login
  lastLoginIP: { type: String, default: null }, // Last login IP address
  lastLogout: { type: Date, default: null }, // Last logout time
  passwordChangedAt: { type: Date, default: null }, // When password was last changed
  twoFactorEnabled: { type: Boolean, default: false }, // 2FA status
  twoFactorSecret: { type: String, default: null }, // 2FA secret (encrypted)
  isActive: { type: Boolean, default: true }, // Account active status
  isEmailVerified: { type: Boolean, default: false }, // Email verification status
  emailVerificationToken: { type: String, default: null }, // Email verification token
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
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
