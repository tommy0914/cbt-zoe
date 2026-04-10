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
        action: `${req.method} ${req.originalUrl || req.path || req.url}`,
        resourceType: 'API_ENDPOINT',
        details: {
          schoolId: req.user ? req.user.schoolId : undefined,
          meta: {
            query: req.query && Object.keys(req.query).length ? req.query : undefined,
            body: req.body && Object.keys(req.body).length ? redact(req.body) : undefined,
          },
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
        },
        ip: req.ip || req.headers['x-forwarded-for'] || undefined,
        createdAt: new Date(),
      };
      await Audit.create(entry);
    } catch (err) {
      console.error('Failed to write audit log:', err.message || err);
    }
  });

  next();
};
