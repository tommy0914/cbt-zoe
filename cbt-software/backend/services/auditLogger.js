const Audit = require('../models/Audit');

async function logAudit({ action, resourceType, resourceId, user, details = {}, ip }) {
  try {
    const entry = new Audit({
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : undefined,
      userId: user?._id ? String(user._id) : (user && user.userId) || undefined,
      username: user?.username || user?.email || undefined,
      role: user?.role || undefined,
      details,
      ip,
    });
    await entry.save();
    return entry;
  } catch (err) {
    console.error('Failed to write audit log:', err);
    return null;
  }
}

module.exports = { logAudit };
