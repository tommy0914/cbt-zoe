// Simple OTP mailer service using Brevo (optional)
// If BREVO_API_KEY and FROM_EMAIL are set, this will send real emails.
// Otherwise it will fall back to logging the OTP to the console.
const nodemailer = require('nodemailer');
const NodemailerSendinblueTransport = require('nodemailer-sendinblue-transport');

const BREVO_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@youngemeritus.com';

let transporter;
let enabled = false;

if (BREVO_KEY) {
  try {
    transporter = nodemailer.createTransport(
      new NodemailerSendinblueTransport({
        apiKey: BREVO_KEY,
      })
    );
    enabled = true;
  } catch (err) {
    console.warn('Brevo not configured correctly:', err.message);
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
    await transporter.sendMail(msg);
    return { success: true };
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { sendOtpEmail };
