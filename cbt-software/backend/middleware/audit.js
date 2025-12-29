const Audit = require('../models/Audit');

function redact(obj) {
  if (!obj) return undefined;
  try {
    const cloned = JSON.parse(JSON.stringify(obj));
    if (cloned && typeof cloned === 'object') {
      if (cloned.password) cloned.password = '[REDACTED]';
      if (cloned.adminPassword) cloned.adminPassword = '[REDACTED]';
      if (cloned.otp) cloned.otp = '[REDACTED]';
    }
    return cloned;
  } catch (_error) {
    return undefined;
  }
}

module.exports = function auditMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', async () => {
    try {
      const entry = {
        userId: req.user ? (req.user._id ? req.user._id.toString() : req.user.id) : undefined,
        username: req.user ? req.user.username : undefined,
        role: req.user ? req.user.role : undefined,
        schoolId: req.user ? req.user.schoolId : undefined,
        method: req.method,
        path: req.originalUrl || req.url,
        meta: {
          query: req.query || undefined,
          body: redact(req.body),
        },
        statusCode: res.statusCode,
        ip: req.ip || req.headers['x-forwarded-for'] || undefined,
        durationMs: Date.now() - start,
        createdAt: new Date(),
      };
      await Audit.create(entry);
    } catch (err) {
      console.error('Failed to write audit log:', err.message || err);
    }
  });

  next();
};
