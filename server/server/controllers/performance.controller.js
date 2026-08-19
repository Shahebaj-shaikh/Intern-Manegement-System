const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Performance = require('../models/Performance');
const Intern = require('../models/Intern');
const logAction = require('../utils/auditLogger');
const { notify } = require('../services/notification.service');

const getPerformance = asyncHandler(async (req, res) => {
  const { intern, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'intern') {
    filter.intern = req.user.profileRef;
  } else if (intern) {
    filter.intern = intern;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [evaluations, total] = await Promise.all([
    Performance.find(filter).populate('intern', 'fullName').populate('evaluatedBy', 'fullName').sort('-createdAt').skip(skip).limit(Number(limit)),
    Performance.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { evaluations, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

const createEvaluation = asyncHandler(async (req, res) => {
  const { intern, ratings } = req.body;
  if (!intern || !ratings) throw new ApiError(400, 'Intern and ratings are required.');

  const internDoc = await Intern.findById(intern);
  if (!internDoc) throw new ApiError(404, 'Intern not found');

  const evaluation = await Performance.create({ ...req.body, evaluatedBy: req.user.profileRef });

  await notify({
    user: internDoc.user,
    type: 'new_feedback',
    title: 'New performance feedback',
    message: 'You have received a new performance evaluation.',
    link: `/performance`,
  });

  await logAction({ user: req.user._id, action: 'PERFORMANCE_EVALUATED', entity: 'Performance', entityId: evaluation._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, evaluation, 'Evaluation submitted'));
});

module.exports = { getPerformance, createEvaluation };
