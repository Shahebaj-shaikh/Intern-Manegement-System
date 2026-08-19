const AuditLog = require('../models/AuditLog');

// Fire-and-forget audit logging - never blocks or fails the main request
const logAction = async ({ user, action, entity, entityId, metadata = {}, ipAddress }) => {
  try {
    await AuditLog.create({ user, action, entity, entityId, metadata, ipAddress });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = logAction;
