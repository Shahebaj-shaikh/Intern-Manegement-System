const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const AuditLog = require('../models/AuditLog');

const getAuditLogs = asyncHandler(async (req, res) => {
  const { entity, action, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate('user', 'email role').sort('-createdAt').skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { logs, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

module.exports = { getAuditLogs };
