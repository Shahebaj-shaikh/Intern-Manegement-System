const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Leave = require('../models/Leave');
const Intern = require('../models/Intern');
const logAction = require('../utils/auditLogger');
const { notify } = require('../services/notification.service');

const getLeaves = asyncHandler(async (req, res) => {
  const { status, intern, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'intern') {
    filter.intern = req.user.profileRef;
  } else if (req.user.role === 'team_lead') {
    const teamInterns = await Intern.find({ teamLeader: req.user.profileRef }).select('_id');
    filter.intern = { $in: teamInterns.map((i) => i._id) };
  } else if (intern) {
    filter.intern = intern;
  }
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [leaves, total] = await Promise.all([
    Leave.find(filter).populate('intern', 'fullName department').sort('-createdAt').skip(skip).limit(Number(limit)),
    Leave.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { leaves, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  if (!leaveType || !startDate || !endDate || !reason) throw new ApiError(400, 'All leave fields are required.');

  const attachment = req.file ? `/uploads/${req.file.filename}` : undefined;
  const leave = await Leave.create({ intern: req.user.profileRef, leaveType, startDate, endDate, reason, attachment });

  await logAction({ user: req.user._id, action: 'LEAVE_APPLIED', entity: 'Leave', entityId: leave._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, leave, 'Leave request submitted'));
});

const reviewLeave = asyncHandler(async (req, res) => {
  const { decision, reviewComment } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) throw new ApiError(400, 'Decision must be approved or rejected.');

  const leave = await Leave.findById(req.params.id).populate('intern', 'user fullName');
  if (!leave) throw new ApiError(404, 'Leave request not found');

  leave.status = decision;
  leave.reviewComment = reviewComment;
  leave.reviewedBy = req.user.profileRef;
  await leave.save();

  await notify({
    user: leave.intern.user,
    type: decision === 'approved' ? 'leave_approved' : 'leave_rejected',
    title: `Leave request ${decision}`,
    message: reviewComment || `Your leave request has been ${decision}.`,
    link: `/leaves/${leave._id}`,
  });

  await logAction({ user: req.user._id, action: 'LEAVE_' + decision.toUpperCase(), entity: 'Leave', entityId: leave._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, leave, `Leave ${decision}`));
});

module.exports = { getLeaves, applyLeave, reviewLeave };
