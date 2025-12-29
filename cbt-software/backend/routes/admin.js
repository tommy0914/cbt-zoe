const express = require('express');
const router = express.Router();
const { verifyToken, requirePermission } = require('../middleware/auth');
const Audit = require('../models/Audit');

// Query audit logs - requires permission 'view_audit'
router.get('/audit', verifyToken, requirePermission('view_audit'), async (req, res) => {
  try {
    const { userId, action, resourceType, limit = 100, since } = req.query;
    const q = {};
    if (userId) q.userId = userId;
    if (action) q.action = action;
    if (resourceType) q.resourceType = resourceType;
    if (since) q.createdAt = { $gte: new Date(since) };
    const logs = await Audit.find(q).sort({ createdAt: -1 }).limit(parseInt(limit, 10));
    res.json({ logs });
  } catch (err) {
    console.error('Error querying audit logs:', err);
    res.status(500).json({ message: 'Failed to query audit logs' });
  }
});

module.exports = router;
