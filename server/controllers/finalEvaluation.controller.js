const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const FinalEvaluation = require('../models/FinalEvaluation');
const Intern = require('../models/Intern');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Performance = require('../models/Performance');

const logAction = require('../utils/auditLogger');

// Calculate attendance summary
const calculateAttendanceSummary = async (internId) => {
  const records = await Attendance.find({ intern: internId });

  const totalDays = records.length;

  const presentDays = records.filter(
    (record) => record.status === 'present'
  ).length;

  const absentDays = records.filter(
    (record) => record.status === 'absent'
  ).length;

  const halfDays = records.filter(
    (record) => record.status === 'half_day'
  ).length;

  const leaveDays = records.filter(
    (record) => record.status === 'leave'
  ).length;

  const attendancePercentage = totalDays
    ? Number((((presentDays + halfDays) / totalDays) * 100).toFixed(1))
    : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    halfDays,
    leaveDays,
    attendancePercentage,
  };
};

// Calculate task summary
const calculateTaskSummary = async (internId) => {
  const tasks = await Task.find({ assignedTo: internId });

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === 'completed'
  ).length;

  const taskCompletionPercentage = totalTasks
    ? Number(((completedTasks / totalTasks) * 100).toFixed(1))
    : 0;

  return {
    totalTasks,
    completedTasks,
    taskCompletionPercentage,
  };
};

// Calculate performance summary
const calculatePerformanceSummary = async (internId) => {
  const evaluation = await Performance.findOne({
    intern: internId,
  }).sort('-createdAt');

  if (!evaluation) {
    return {
      overallScore: 0,
      feedback: '',
    };
  }

  return {
    overallScore: evaluation.overallScore || 0,
    feedback: evaluation.feedback || '',
  };
};

// Calculate total working hours
const calculateWorkLogSummary = async (internId) => {
  const records = await Attendance.find({ intern: internId });

  const totalHours = records.reduce(
    (sum, record) => sum + (record.workingHours || 0),
    0
  );

  return {
    totalHours: Number(totalHours.toFixed(2)),
  };
};

// POST /api/final-evaluations
const createFinalEvaluation = asyncHandler(async (req, res) => {
  const { intern, outcome, feedbackSummary, comments } = req.body;

  if (!intern) {
    throw new ApiError(400, 'Intern is required.');
  }

  if (!outcome) {
    throw new ApiError(400, 'Outcome is required.');
  }

  if (!['COMPLETED', 'EXTENDED', 'TERMINATED'].includes(outcome)) {
    throw new ApiError(
      400,
      'Outcome must be COMPLETED, EXTENDED or TERMINATED.'
    );
  }

  const internDoc = await Intern.findById(intern);

  if (!internDoc) {
    throw new ApiError(404, 'Intern not found.');
  }

  const attendanceSummary = await calculateAttendanceSummary(intern);
  const taskSummary = await calculateTaskSummary(intern);
  const performanceSummary = await calculatePerformanceSummary(intern);
  const workLogSummary = await calculateWorkLogSummary(intern);

  const evaluation = await FinalEvaluation.create({
    intern,
    evaluatedBy: req.user.profileRef,

    attendanceSummary,
    taskSummary,
    performanceSummary,
    workLogSummary,

    feedbackSummary:
      feedbackSummary || performanceSummary.feedback || '',

    outcome,
    comments,
  });

  await logAction({
    user: req.user._id,
    action: 'FINAL_EVALUATION_CREATED',
    entity: 'FinalEvaluation',
    entityId: evaluation._id,
    ipAddress: req.ip,
  });

  const populatedEvaluation = await FinalEvaluation.findById(
    evaluation._id
  )
    .populate('intern', 'fullName email department teamLeader')
    .populate('evaluatedBy', 'fullName email designation');

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        populatedEvaluation,
        'Final evaluation created successfully'
      )
    );
});

// GET /api/final-evaluations
const getFinalEvaluations = asyncHandler(async (req, res) => {
  const evaluations = await FinalEvaluation.find()
    .populate('intern', 'fullName email department teamLeader')
    .populate('evaluatedBy', 'fullName email designation')
    .sort('-createdAt');

  res.json(
    new ApiResponse(200, evaluations, 'Final evaluations fetched successfully')
  );
});

// GET /api/final-evaluations/:internId
const getFinalEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await FinalEvaluation.findOne({
    intern: req.params.internId,
  })
    .populate('intern', 'fullName email department teamLeader')
    .populate('evaluatedBy', 'fullName email designation')
    .sort('-createdAt');

  if (!evaluation) {
    throw new ApiError(
      404,
      'Final evaluation not found for this intern.'
    );
  }

  res.json(
    new ApiResponse(
      200,
      evaluation,
      'Final evaluation fetched successfully'
    )
  );
});

module.exports = {
  createFinalEvaluation,
  getFinalEvaluations,
  getFinalEvaluation,
};