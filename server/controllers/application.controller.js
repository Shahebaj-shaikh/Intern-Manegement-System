const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const logAction = require('../utils/auditLogger');

// Defines the only legal forward moves in the pipeline:
// applied -> shortlisted -> interview -> selected | rejected
// A candidate can be rejected from any non-terminal stage, but cannot skip stages forward.
const ALLOWED_TRANSITIONS = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['selected', 'rejected'],
  selected: [],
  rejected: [],
};

// GET /api/applications?status=&department=&candidate=&search=&sort=&page=&limit=
const getApplications = asyncHandler(async (req, res) => {
  const { status, department, candidate, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (department) filter.department = department;
  if (candidate) filter.candidate = candidate;

  let query = Application.find(filter).populate('candidate', 'fullName email phone').populate('department', 'name').populate('decisionBy', 'fullName');

  if (search) {
    const matchingCandidates = await Candidate.find({ $text: { $search: search } }).select('_id');
    query = query.find({ candidate: { $in: matchingCandidates.map((c) => c._id) } });
  }

  const total = await Application.countDocuments(query.getFilter());
  const skip = (Number(page) - 1) * Number(limit);
  const applications = await query.sort(sort).skip(skip).limit(Number(limit));

  res.json(new ApiResponse(200, { applications, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

// GET /api/applications/:id
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('candidate')
    .populate('department', 'name')
    .populate('decisionBy', 'fullName')
    .populate('statusHistory.changedBy', 'fullName');
  if (!application) throw new ApiError(404, 'Application not found');
  res.json(new ApiResponse(200, application));
});

// POST /api/applications
const createApplication = asyncHandler(async (req, res) => {
  const { candidate, department, positionTitle, notes } = req.body;
  if (!candidate || !department) throw new ApiError(400, 'Candidate and department/program are required.');

  const candidateDoc = await Candidate.findById(candidate);
  if (!candidateDoc) throw new ApiError(404, 'Candidate not found');

  const application = await Application.create({
    candidate,
    department,
    positionTitle,
    notes,
    createdBy: req.user.profileRef,
    statusHistory: [{ status: 'applied', changedBy: req.user.profileRef, changedByName: req.user.email, note: 'Application created' }],
  });

  await logAction({ user: req.user._id, action: 'APPLICATION_CREATED', entity: 'Application', entityId: application._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, application, 'Application created successfully'));
});

// PUT /api/applications/:id
const updateApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, 'Application not found');

  const { status, ...updates } = req.body; // status changes only via the dedicated workflow endpoint
  Object.assign(application, updates);
  await application.save();

  await logAction({ user: req.user._id, action: 'APPLICATION_UPDATED', entity: 'Application', entityId: application._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, application, 'Application updated successfully'));
});

// PUT /api/applications/:id/status   { status: 'shortlisted' | 'interview' | 'selected' | 'rejected', note, interviewDate? }
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note, interviewDate } = req.body;
  const validTargets = ['shortlisted', 'interview', 'selected', 'rejected'];
  if (!validTargets.includes(status)) throw new ApiError(400, 'Invalid target status.');

  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, 'Application not found');

  const allowed = ALLOWED_TRANSITIONS[application.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Cannot move an application from "${application.status}" to "${status}".`);
  }

  application.status = status;
  if (status === 'interview' && interviewDate) application.interviewDate = interviewDate;
  if (status === 'selected' || status === 'rejected') {
    application.decision = status;
    application.decisionAt = new Date();
    application.decisionBy = req.user.profileRef;
  }

  application.statusHistory.push({
    status,
    changedBy: req.user.profileRef,
    changedByName: req.user.email,
    note,
    changedAt: new Date(),
  });

  await application.save();

  await logAction({
    user: req.user._id,
    action: 'APPLICATION_STATUS_CHANGED',
    entity: 'Application',
    entityId: application._id,
    metadata: { status, note },
    ipAddress: req.ip,
  });

  res.json(new ApiResponse(200, application, `Application moved to "${status}"`));
});

module.exports = { getApplications, getApplicationById, createApplication, updateApplication, updateStatus };
