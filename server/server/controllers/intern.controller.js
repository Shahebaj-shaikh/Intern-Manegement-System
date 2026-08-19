const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Intern = require('../models/Intern');
const User = require('../models/User');
const logAction = require('../utils/auditLogger');

// GET /api/interns?search=&department=&status=&teamLeader=&page=&limit=&sort=
const getInterns = asyncHandler(async (req, res) => {
  const { search, department, status, teamLeader, page = 1, limit = 20, sort = '-createdAt' } = req.query;
  const filter = {};

  // Team leads only see their assigned interns
  if (req.user.role === 'team_lead') {
    filter.teamLeader = req.user.profileRef;
  } else if (teamLeader) {
    filter.teamLeader = teamLeader;
  }

  if (department) filter.department = department;
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [interns, total] = await Promise.all([
    Intern.find(filter).populate('department', 'name').populate('teamLeader', 'fullName').sort(sort).skip(skip).limit(Number(limit)),
    Intern.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { interns, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

// GET /api/interns/:id
const getInternById = asyncHandler(async (req, res) => {
  const intern = await Intern.findById(req.params.id).populate('department').populate('teamLeader', 'fullName email');
  if (!intern) throw new ApiError(404, 'Intern not found');
  if (req.user.role === 'team_lead' && String(intern.teamLeader?._id) !== String(req.user.profileRef)) {
    throw new ApiError(403, 'You can only view interns assigned to you.');
  }
  res.json(new ApiResponse(200, intern));
});

// POST /api/interns  (HR/Admin only) - creates User + Intern together
const createIntern = asyncHandler(async (req, res) => {
  const { email, password, fullName, ...rest } = req.body;
  if (!email || !password || !fullName) throw new ApiError(400, 'Email, password, and full name are required.');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'A user with this email already exists.');

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ email: email.toLowerCase(), password: hashedPassword, role: 'intern' });

  const intern = await Intern.create({ user: user._id, email: email.toLowerCase(), fullName, ...rest });

  user.profileRef = intern._id;
  user.profileModel = 'Intern';
  await user.save();

  await logAction({ user: req.user._id, action: 'INTERN_CREATED', entity: 'Intern', entityId: intern._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, intern, 'Intern created successfully'));
});

// PUT /api/interns/:id
const updateIntern = asyncHandler(async (req, res) => {
  const intern = await Intern.findById(req.params.id);
  if (!intern) throw new ApiError(404, 'Intern not found');

  const { email, password, ...updates } = req.body; // email/password changes go through auth routes
  Object.assign(intern, updates);
  // Once HR assigns a department, treat the profile as reviewed/complete
  if (updates.department && !intern.profileComplete) intern.profileComplete = true;
  await intern.save();

  await logAction({ user: req.user._id, action: 'INTERN_UPDATED', entity: 'Intern', entityId: intern._id, metadata: updates, ipAddress: req.ip });
  res.json(new ApiResponse(200, intern, 'Intern updated successfully'));
});

// DELETE /api/interns/:id  (soft delete -> terminated + deactivate login)
const deleteIntern = asyncHandler(async (req, res) => {
  const intern = await Intern.findById(req.params.id);
  if (!intern) throw new ApiError(404, 'Intern not found');

  intern.status = 'terminated';
  await intern.save();
  await User.updateOne({ _id: intern.user }, { isActive: false });

  await logAction({ user: req.user._id, action: 'INTERN_DELETED', entity: 'Intern', entityId: intern._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, null, 'Intern deactivated successfully'));
});

module.exports = { getInterns, getInternById, createIntern, updateIntern, deleteIntern };
