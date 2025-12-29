// Simple OTP mailer service using SendGrid (optional)
// If SENDGRID_API_KEY and FROM_EMAIL are set, this will send real emails.
// Otherwise it will fall back to logging the OTP to the console.
let sgMail = null;
try {
  // optional dependency — if not installed, we'll fall back to dev logging

  sgMail = require('@sendgrid/mail');
} catch (_error) {
  sgMail = null;
}

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@youngemeritus.com';

let enabled = false;
if (SENDGRID_KEY && sgMail) {
  try {
    sgMail.setApiKey(SENDGRID_KEY);
    enabled = true;
  } catch (err) {
    console.warn('SendGrid not configured correctly:', err.message);
    enabled = false;
  }
}

async function sendOtpEmail(to, otp, registrationId, expiresAt) {
  const subject = 'Your YoungEmeritus School Registration OTP';
  const html = `<p>Your OTP for registering <strong>YoungEmeritus</strong> is <strong>${otp}</strong>.</p>
  <p>This code expires at ${expiresAt}.</p>
  <p>Registration ID: ${registrationId}</p>`;

  if (!enabled) {
    console.log(`(DEV) OTP for ${to}: ${otp} (registrationId: ${registrationId}, expires: ${expiresAt})`);
    return { success: true, dev: true };
  }

  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { sendOtpEmail };
