// Password service for generating and managing temporary passwords
const crypto = require('crypto');

/**
 * Generate a secure temporary password
 * @returns {string} Random 12-character alphanumeric password
 */
function generateTemporaryPassword() {
  return crypto.randomBytes(9).toString('hex').substring(0, 12).toUpperCase();
}

/**
 * Generate a password reset token
 * @returns {Object} { token, hashedToken, expiresAt }
 */
function generatePasswordResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    token, // Send to user
    hashedToken, // Store in DB
    expiresAt
  };
}

module.exports = {
  generateTemporaryPassword,
  generatePasswordResetToken
};
