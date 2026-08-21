const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Task = require('../models/Task');
const TaskSubmission = require('../models/TaskSubmission');
const Intern = require('../models/Intern');
const logAction = require('../utils/auditLogger');
const { notify } = require('../services/notification.service');

const OPEN_STATUSES = ['not_started', 'in_progress', 'submitted', 'under_review', 'rejected'];
const INTERN_MOVE_STATUSES = ['not_started', 'in_progress'];

// GET /api/tasks?status=&priority=&assignedTo=&search=&overdue=
const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, search, overdue, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'intern') {
    filter.assignedTo = req.user.profileRef;
  } else if (req.user.role === 'team_lead') {
    filter.createdBy = req.user.profileRef;
  }
  if (assignedTo) filter.assignedTo = assignedTo;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (overdue === 'true') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    filter.deadline = { $lt: startOfToday };
    if (!status) filter.status = { $in: OPEN_STATUSES };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName')
      .populate('department', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Task.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { tasks, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('assignedTo', 'fullName').populate('createdBy', 'fullName').populate('department', 'name');
  if (!task) throw new ApiError(404, 'Task not found');
  const submissions = await TaskSubmission.find({ task: task._id }).sort('-submittedAt');
  res.json(new ApiResponse(200, { task, submissions }));
});

// POST /api/tasks (team lead / hr)
const createTask = asyncHandler(async (req, res) => {
  const { title, assignedTo, deadline } = req.body;
  if (!title || !assignedTo || !deadline) throw new ApiError(400, 'Title, assignedTo, and deadline are required.');

  const intern = await Intern.findById(assignedTo);
  if (!intern) throw new ApiError(404, 'Assigned intern not found');

  const task = await Task.create({ ...req.body, createdBy: req.user.profileRef });

  await notify({
    user: intern.user,
    type: 'task_assigned',
    title: 'New task assigned',
    message: `You have been assigned a new task: "${task.title}"`,
    link: `/tasks/${task._id}`,
  });

  await logAction({ user: req.user._id, action: 'TASK_CREATED', entity: 'Task', entityId: task._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, task, 'Task created successfully'));
});

// PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  Object.assign(task, req.body);
  await task.save();

  await logAction({ user: req.user._id, action: 'TASK_UPDATED', entity: 'Task', entityId: task._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, task, 'Task updated successfully'));
});

// PUT /api/tasks/:id/status  (intern moves task across kanban)
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['not_started', 'in_progress', 'submitted', 'under_review', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) throw new ApiError(400, 'Invalid status value.');

  const task = await Task.findById(req.params.id).populate('createdBy', 'fullName user');
  if (!task) throw new ApiError(404, 'Task not found');

  if (req.user.role === 'intern') {
    if (String(task.assignedTo) !== String(req.user.profileRef)) {
      throw new ApiError(403, 'You can only update tasks assigned to you.');
    }
    if (!INTERN_MOVE_STATUSES.includes(task.status) || !INTERN_MOVE_STATUSES.includes(status)) {
      throw new ApiError(400, 'Interns can only move tasks between To Do and In Progress. Submit work from the task page.');
    }
  }

  task.status = status;
  await task.save();
  res.json(new ApiResponse(200, task, 'Task status updated'));
});

// POST /api/tasks/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new ApiError(400, 'Comment text is required.');

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  task.comments.push({ author: req.user._id, authorName: req.user.email, text });
  await task.save();
  res.json(new ApiResponse(200, task, 'Comment added'));
});

// POST /api/tasks/:id/submit  (intern submits work, with file paths already uploaded)
const submitTask = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const task = await Task.findById(req.params.id).populate('createdBy');
  if (!task) throw new ApiError(404, 'Task not found');

  const files = (req.files || []).map((f) => `/uploads/${f.filename}`);

  const submission = await TaskSubmission.create({
    task: task._id,
    submittedBy: req.user.profileRef,
    files,
    notes,
  });

  task.status = 'submitted';
  if (files.length) task.attachments.push(...files);
  await task.save();

  const createdByEmployee = task.createdBy;
  if (createdByEmployee?.user) {
    await notify({
      user: createdByEmployee.user,
      type: 'task_submitted',
      title: 'Task submitted for review',
      message: `A task "${task.title}" was submitted and needs your review.`,
      link: `/tasks/${task._id}`,
    });
  }

  await logAction({ user: req.user._id, action: 'TASK_SUBMITTED', entity: 'Task', entityId: task._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, submission, 'Task submitted successfully'));
});

// PUT /api/tasks/:taskId/submissions/:submissionId/review
const reviewSubmission = asyncHandler(async (req, res) => {
  const { decision, feedback } = req.body; // decision: 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) throw new ApiError(400, 'Decision must be approved or rejected.');

  const submission = await TaskSubmission.findById(req.params.submissionId).populate({
    path: 'submittedBy',
    select: 'user fullName',
  });
  if (!submission) throw new ApiError(404, 'Submission not found');

  submission.reviewStatus = decision;
  submission.feedback = feedback;
  submission.reviewedBy = req.user.profileRef;
  submission.reviewedAt = new Date();
  await submission.save();

  const task = await Task.findById(submission.task);
  task.status = decision === 'approved' ? 'completed' : 'rejected';
  await task.save();

  await notify({
    user: submission.submittedBy.user,
    type: decision === 'approved' ? 'task_approved' : 'task_rejected',
    title: decision === 'approved' ? 'Task approved!' : 'Task needs changes',
    message: feedback || `Your task submission was ${decision}.`,
    link: `/tasks/${task._id}`,
  });

  await logAction({ user: req.user._id, action: 'TASK_REVIEWED', entity: 'TaskSubmission', entityId: submission._id, metadata: { decision }, ipAddress: req.ip });
  res.json(new ApiResponse(200, submission, `Submission ${decision}`));
});

module.exports = { getTasks, getTaskById, createTask, updateTask, updateTaskStatus, addComment, submitTask, reviewSubmission };
