const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const SALT_ROUNDS = 10;

// Export a factory that returns a User model bound to the provided connection
module.exports = function (conn) {
  const schema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
    createdAt: { type: Date, default: Date.now },
  });

  schema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hash;
  });

  schema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Avoid model overwrite error: check existing model on this connection
  try {
    return conn.model('User');
  } catch (_error) {
    return conn.model('User', schema);
  }
};
