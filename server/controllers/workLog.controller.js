const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const WorkLog = require('../models/WorkLog');
const Task = require('../models/Task');
const Intern = require('../models/Intern');
const logAction = require('../utils/auditLogger');

async function refreshTaskActualHours(taskId) {
  const logs = await WorkLog.find({ task: taskId }).select('hours');
  const actualHours = logs.reduce((sum, log) => sum + (log.hours || 0), 0);
  await Task.findByIdAndUpdate(taskId, { actualHours });
}

async function assertCanViewLog(req, log) {
  if (req.user.role === 'intern') {
    if (String(log.intern) !== String(req.user.profileRef)) {
      throw new ApiError(403, 'You can only view your own work logs.');
    }
    return;
  }
  if (req.user.role === 'team_lead') {
    const intern = await Intern.findById(log.intern).select('teamLeader');
    const task = await Task.findById(log.task).select('createdBy');
    const managesIntern = intern && String(intern.teamLeader) === String(req.user.profileRef);
    const ownsTask = task && String(task.createdBy) === String(req.user.profileRef);
    if (!managesIntern && !ownsTask) {
      throw new ApiError(403, 'You do not have access to this work log.');
    }
  }
}

const createWorkLog = asyncHandler(async (req, res) => {
  const { task, date, hours, workCompleted, nextSteps, blockers } = req.body;
  if (!task || !date || hours == null || !workCompleted) {
    throw new ApiError(400, 'Task, date, hours, and work completed are required.');
  }

  const linkedTask = await Task.findById(task);
  if (!linkedTask) throw new ApiError(404, 'Task not found');
  if (String(linkedTask.assignedTo) !== String(req.user.profileRef)) {
    throw new ApiError(403, 'You can only log work on tasks assigned to you.');
  }

  const log = await WorkLog.create({
    intern: req.user.profileRef,
    task,
    date,
    hours,
    workCompleted,
    nextSteps: nextSteps || '',
    blockers: blockers || '',
  });

  await refreshTaskActualHours(task);
  await logAction({
    user: req.user._id,
    action: 'WORKLOG_CREATED',
    entity: 'WorkLog',
    entityId: log._id,
    ipAddress: req.ip,
  });

  res.status(201).json(new ApiResponse(201, log, 'Work log submitted'));
});

const getWorkLogs = asyncHandler(async (req, res) => {
  const { task, intern, from, to, important, search, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (req.user.role === 'intern') {
    filter.intern = req.user.profileRef;
  } else {
    if (req.user.role === 'team_lead') {
      const interns = await Intern.find({ teamLeader: req.user.profileRef }).select('_id');
      const internIds = interns.map((item) => item._id);
      const tasks = await Task.find({ createdBy: req.user.profileRef }).select('_id');
      const taskIds = tasks.map((item) => item._id);
      filter.$or = [{ intern: { $in: internIds } }, { task: { $in: taskIds } }];
    }
    if (intern) filter.intern = intern;
  }
  if (task) filter.task = task;
  if (important === 'true') filter.important = true;
  if (important === 'false') filter.important = false;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  let query = WorkLog.find(filter)
    .populate('intern', 'fullName')
    .populate('task', 'title status deadline')
    .populate('reviewedBy', 'fullName')
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const [logs, total] = await Promise.all([query, WorkLog.countDocuments(filter)]);

  let items = logs;
  if (search) {
    const term = String(search).toLowerCase();
    items = logs.filter((log) => {
      const haystack = `${log.intern?.fullName || ''} ${log.task?.title || ''} ${log.workCompleted || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }

  res.json(
    new ApiResponse(200, {
      workLogs: items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    })
  );
});

const getWorkLogById = asyncHandler(async (req, res) => {
  const log = await WorkLog.findById(req.params.id)
    .populate('intern', 'fullName')
    .populate('task', 'title status deadline assignedTo')
    .populate('reviewedBy', 'fullName');
  if (!log) throw new ApiError(404, 'Work log not found');
  await assertCanViewLog(req, log);
  res.json(new ApiResponse(200, log));
});

const updateWorkLog = asyncHandler(async (req, res) => {
  const log = await WorkLog.findById(req.params.id);
  if (!log) throw new ApiError(404, 'Work log not found');

  if (req.user.role !== 'intern' || String(log.intern) !== String(req.user.profileRef)) {
    throw new ApiError(403, 'You can only edit your own work logs.');
  }
  if (log.reviewedAt) {
    throw new ApiError(400, 'This log has already been reviewed.');
  }

  ['date', 'hours', 'workCompleted', 'nextSteps', 'blockers'].forEach((field) => {
    if (req.body[field] !== undefined) log[field] = req.body[field];
  });
  await log.save();
  await refreshTaskActualHours(log.task);

  res.json(new ApiResponse(200, log, 'Work log updated'));
});

const reviewWorkLog = asyncHandler(async (req, res) => {
  const { managerComment, important } = req.body;
  const log = await WorkLog.findById(req.params.id);
  if (!log) throw new ApiError(404, 'Work log not found');

  log.managerComment = managerComment || '';
  if (important !== undefined) log.important = Boolean(important);
  log.reviewedBy = req.user.profileRef;
  log.reviewedAt = new Date();
  await log.save();

  await logAction({
    user: req.user._id,
    action: 'WORKLOG_REVIEWED',
    entity: 'WorkLog',
    entityId: log._id,
    ipAddress: req.ip,
  });

  const populated = await WorkLog.findById(log._id)
    .populate('intern', 'fullName')
    .populate('task', 'title status deadline')
    .populate('reviewedBy', 'fullName');

  res.json(new ApiResponse(200, populated, 'Work log reviewed'));
});

const deleteWorkLog = asyncHandler(async (req, res) => {
  const log = await WorkLog.findById(req.params.id);
  if (!log) throw new ApiError(404, 'Work log not found');

  if (req.user.role === 'intern') {
    if (String(log.intern) !== String(req.user.profileRef)) {
      throw new ApiError(403, 'Not authorized');
    }
    if (log.reviewedAt) throw new ApiError(400, 'Reviewed work logs cannot be deleted.');
  }

  const taskId = log.task;
  await log.deleteOne();
  await refreshTaskActualHours(taskId);
  res.json(new ApiResponse(200, null, 'Work log deleted'));
});

module.exports = {
  createWorkLog,
  getWorkLogs,
  getWorkLogById,
  updateWorkLog,
  reviewWorkLog,
  deleteWorkLog,
};
