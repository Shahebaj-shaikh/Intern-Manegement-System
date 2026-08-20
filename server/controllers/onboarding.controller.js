const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Onboarding = require('../models/Onboarding');
const Document = require('../models/Document');
const logAction = require('../utils/auditLogger');

// GET /api/onboarding
// HR/Admin: view all onboarding records
// Intern: view only their own onboarding
const getOnboardings = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'intern') {
    filter.intern = req.user.profileRef;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const onboardings = await Onboarding.find(filter)
    .populate('intern', 'fullName email department status')
    .populate(
      'offer',
      'offerTitle joiningDate internshipEndDate status'
    )
    .populate('completedBy', 'email role')
    .sort('-createdAt');

  res.json(new ApiResponse(200, onboardings));
});

// GET /api/onboarding/:id
const getOnboardingById = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findById(req.params.id)
    .populate('intern', 'fullName email department status')
    .populate(
      'offer',
      'offerTitle joiningDate internshipEndDate status'
    )
    .populate('completedBy', 'email role');

  if (!onboarding) {
    throw new ApiError(404, 'Onboarding record not found');
  }

  if (
    req.user.role === 'intern' &&
    String(onboarding.intern._id) !== String(req.user.profileRef)
  ) {
    throw new ApiError(
      403,
      'You can only view your own onboarding.'
    );
  }

  res.json(new ApiResponse(200, onboarding));
});

// GET /api/onboarding/:id/progress
const getOnboardingProgress = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findById(req.params.id);

  if (!onboarding) {
    throw new ApiError(404, 'Onboarding record not found');
  }

  if (
    req.user.role === 'intern' &&
    String(onboarding.intern) !== String(req.user.profileRef)
  ) {
    throw new ApiError(
      403,
      'You can only view your own onboarding progress.'
    );
  }

  const documents = await Document.find({
    owner: onboarding.intern,
    ownerModel: 'Intern',
  }).sort('-createdAt');

  const documentTypes = new Set(
    documents.map((document) => document.type)
  );

  // Keep the existing checklist, but calculate progress
  // only from the 3 required onboarding documents.
  const checklist = {
    ...(onboarding.checklist?.toObject
      ? onboarding.checklist.toObject()
      : onboarding.checklist),
  };

  checklist.offerLetterSubmitted =
    documentTypes.has('offer_letter');

  checklist.collegeIdSubmitted =
    documentTypes.has('college_id');

  checklist.joiningDocumentSubmitted =
    documentTypes.has('joining_doc');

  const requiredDocumentKeys = [
    'offerLetterSubmitted',
    'collegeIdSubmitted',
    'joiningDocumentSubmitted',
  ];

  const completedItems = requiredDocumentKeys.filter(
    (key) => checklist[key]
  ).length;

  const totalItems = requiredDocumentKeys.length;

  const progress = Math.round(
    (completedItems / totalItems) * 100
  );

  // Automatically move onboarding from not_started
  // to in_progress once onboarding activity begins.
  if (
    onboarding.status === 'not_started' &&
    completedItems > 0
  ) {
    onboarding.status = 'in_progress';
    await onboarding.save();
  }

  res.json(
    new ApiResponse(200, {
      onboarding,
      checklist,
      progress,
      documents,
    })
  );
});

// PUT /api/onboarding/:id
// HR/Admin only
const updateOnboarding = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findById(req.params.id);

  if (!onboarding) {
    throw new ApiError(404, 'Onboarding record not found');
  }

  const {
    status,
    profileCompleted,
    hrNotes,
  } = req.body;

  if (
    status &&
    !['not_started', 'in_progress', 'completed'].includes(status)
  ) {
    throw new ApiError(
      400,
      'Invalid onboarding status.'
    );
  }

  if (status) {
    onboarding.status = status;
  }

  if (profileCompleted !== undefined) {
    onboarding.checklist.profileCompleted =
      Boolean(profileCompleted);
  }

  if (hrNotes !== undefined) {
    onboarding.hrNotes = hrNotes;
  }

  if (onboarding.status === 'completed') {
    onboarding.completedAt = new Date();
    onboarding.completedBy = req.user._id;
  } else {
    onboarding.completedAt = undefined;
    onboarding.completedBy = undefined;
  }

  await onboarding.save();

  await logAction({
    user: req.user._id,
    action: 'ONBOARDING_UPDATED',
    entity: 'Onboarding',
    entityId: onboarding._id,
    metadata: req.body,
    ipAddress: req.ip,
  });

  res.json(
    new ApiResponse(
      200,
      onboarding,
      'Onboarding updated successfully'
    )
  );
});

// PUT /api/onboarding/:id/start
// HR/Admin only
const startOnboarding = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findById(req.params.id);

  if (!onboarding) {
    throw new ApiError(404, 'Onboarding record not found');
  }

  if (onboarding.status === 'completed') {
    throw new ApiError(
      400,
      'Completed onboarding cannot be restarted.'
    );
  }

  onboarding.status = 'in_progress';

  await onboarding.save();

  await logAction({
    user: req.user._id,
    action: 'ONBOARDING_STARTED',
    entity: 'Onboarding',
    entityId: onboarding._id,
    ipAddress: req.ip,
  });

  res.json(
    new ApiResponse(
      200,
      onboarding,
      'Onboarding started successfully'
    )
  );
});

// PUT /api/onboarding/:id/complete
// HR/Admin only
const completeOnboarding = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findById(req.params.id);

  if (!onboarding) {
    throw new ApiError(404, 'Onboarding record not found');
  }

  const documents = await Document.find({
    owner: onboarding.intern,
    ownerModel: 'Intern',
  });

  const documentTypes = new Set(
    documents.map((document) => document.type)
  );

  const requiredDocumentsPresent =
    documentTypes.has('offer_letter') &&
    documentTypes.has('college_id') &&
    documentTypes.has('joining_doc');

  if (!requiredDocumentsPresent) {
    throw new ApiError(
      400,
      'Required onboarding documents are not complete.'
    );
  }

  onboarding.checklist.offerLetterSubmitted = true;
  onboarding.checklist.collegeIdSubmitted = true;
  onboarding.checklist.joiningDocumentSubmitted = true;

  onboarding.status = 'completed';
  onboarding.completedAt = new Date();
  onboarding.completedBy = req.user._id;

  await onboarding.save();

  await logAction({
    user: req.user._id,
    action: 'ONBOARDING_COMPLETED',
    entity: 'Onboarding',
    entityId: onboarding._id,
    ipAddress: req.ip,
  });

  res.json(
    new ApiResponse(
      200,
      onboarding,
      'Onboarding completed successfully'
    )
  );
});

module.exports = {
  getOnboardings,
  getOnboardingById,
  getOnboardingProgress,
  updateOnboarding,
  startOnboarding,
  completeOnboarding,
};