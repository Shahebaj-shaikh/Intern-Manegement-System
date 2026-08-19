const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const logAction = require('../utils/auditLogger');

// GET /api/candidates?search=&source=&skill=&archived=&sort=&page=&limit=
const getCandidates = asyncHandler(async (req, res) => {
  const { search, source, skill, archived, sort = '-createdAt', page = 1, limit = 20 } = req.query;
  const filter = {};

  filter.isArchived = archived === 'true';
  if (source) filter.source = source;
  if (skill) filter.skills = { $regex: skill, $options: 'i' };
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [candidates, total] = await Promise.all([
    Candidate.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Candidate.countDocuments(filter),
  ]);

  // attach a lightweight count of applications per candidate for the list view
  const withCounts = await Promise.all(
    candidates.map(async (c) => {
      const applicationCount = await Application.countDocuments({ candidate: c._id });
      return { ...c.toObject(), applicationCount };
    })
  );

  res.json(new ApiResponse(200, { candidates: withCounts, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

// GET /api/candidates/:id
const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) throw new ApiError(404, 'Candidate not found');

  const applications = await Application.find({ candidate: candidate._id })
    .populate('department', 'name')
    .populate('decisionBy', 'fullName')
    .sort('-createdAt');

  res.json(new ApiResponse(200, { candidate, applications }));
});

// POST /api/candidates
const createCandidate = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) throw new ApiError(400, 'Full name and email are required.');

  const existing = await Candidate.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'A candidate with this email already exists.');

  const skills = typeof req.body.skills === 'string'
    ? req.body.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : req.body.skills;

  const resume = req.file
    ? { fileName: req.file.originalname, filePath: `/uploads/${req.file.filename}`, fileSize: req.file.size }
    : undefined;

  const candidate = await Candidate.create({
    fullName,
    email: email.toLowerCase(),
    phone: req.body.phone,
    education: {
      degree: req.body.degree,
      institution: req.body.institution,
      branch: req.body.branch,
      graduationYear: req.body.graduationYear || undefined,
    },
    skills,
    source: req.body.source || 'other',
    profileSummary: req.body.profileSummary,
    resume,
    createdBy: req.user.profileRef,
  });

  await logAction({ user: req.user._id, action: 'CANDIDATE_CREATED', entity: 'Candidate', entityId: candidate._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, candidate, 'Candidate added successfully'));
});

// PUT /api/candidates/:id
const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) throw new ApiError(404, 'Candidate not found');

  const { email, skills, degree, institution, branch, graduationYear, ...rest } = req.body;

  if (email && email.toLowerCase() !== candidate.email) {
    const existing = await Candidate.findOne({ email: email.toLowerCase(), _id: { $ne: candidate._id } });
    if (existing) throw new ApiError(409, 'Another candidate already uses this email.');
    candidate.email = email.toLowerCase();
  }

  if (skills !== undefined) {
    candidate.skills = typeof skills === 'string' ? skills.split(',').map((s) => s.trim()).filter(Boolean) : skills;
  }

  candidate.education = {
    degree: degree ?? candidate.education?.degree,
    institution: institution ?? candidate.education?.institution,
    branch: branch ?? candidate.education?.branch,
    graduationYear: graduationYear ?? candidate.education?.graduationYear,
  };

  if (req.file) {
    candidate.resume = { fileName: req.file.originalname, filePath: `/uploads/${req.file.filename}`, fileSize: req.file.size };
  }

  Object.assign(candidate, rest);
  await candidate.save();

  await logAction({ user: req.user._id, action: 'CANDIDATE_UPDATED', entity: 'Candidate', entityId: candidate._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, candidate, 'Candidate updated successfully'));
});

// DELETE /api/candidates/:id  (archive, not a hard delete - preserves application history)
const archiveCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) throw new ApiError(404, 'Candidate not found');

  candidate.isArchived = true;
  candidate.archivedAt = new Date();
  await candidate.save();

  await logAction({ user: req.user._id, action: 'CANDIDATE_ARCHIVED', entity: 'Candidate', entityId: candidate._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, null, 'Candidate archived successfully'));
});

// PUT /api/candidates/:id/restore
const restoreCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) throw new ApiError(404, 'Candidate not found');

  candidate.isArchived = false;
  candidate.archivedAt = undefined;
  await candidate.save();

  await logAction({ user: req.user._id, action: 'CANDIDATE_RESTORED', entity: 'Candidate', entityId: candidate._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, candidate, 'Candidate restored'));
});

module.exports = { getCandidates, getCandidateById, createCandidate, updateCandidate, archiveCandidate, restoreCandidate };
