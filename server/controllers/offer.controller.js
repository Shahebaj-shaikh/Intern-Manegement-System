const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Offer = require('../models/Offer');
const Intern = require('../models/Intern');
const Onboarding = require('../models/Onboarding');
const logAction = require('../utils/auditLogger');

// GET /api/offers
// HR/Admin: view all offers
// Intern: view only their own offers
const getOffers = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'intern') {
    filter.intern = req.user.profileRef;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const offers = await Offer.find(filter)
    .populate('intern', 'fullName email department status')
    .populate('department', 'name')
    .populate('offeredBy', 'email role')
    .sort('-createdAt');

  res.json(new ApiResponse(200, offers));
});

// GET /api/offers/:id
const getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
    .populate('intern', 'fullName email department status')
    .populate('department', 'name')
    .populate('offeredBy', 'email role');

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  if (
    req.user.role === 'intern' &&
    String(offer.intern._id) !== String(req.user.profileRef)
  ) {
    throw new ApiError(403, 'You can only view your own offers.');
  }

  res.json(new ApiResponse(200, offer));
});

// POST /api/offers
// HR/Admin only
const createOffer = asyncHandler(async (req, res) => {
  const {
    intern,
    offerTitle,
    department,
    internshipType,
    stipend,
    joiningDate,
    internshipEndDate,
    notes,
  } = req.body;

  if (
    !intern ||
    !offerTitle ||
    !internshipType ||
    !joiningDate ||
    !internshipEndDate
  ) {
    throw new ApiError(
      400,
      'Intern, offer title, internship type, joining date, and internship end date are required.'
    );
  }

  const internRecord = await Intern.findById(intern);

  if (!internRecord) {
    throw new ApiError(404, 'Intern not found');
  }

  if (new Date(internshipEndDate) <= new Date(joiningDate)) {
    throw new ApiError(
      400,
      'Internship end date must be after the joining date.'
    );
  }

  const existingOffer = await Offer.findOne({
    intern,
    status: { $in: ['draft', 'offered', 'accepted'] },
  });

  if (existingOffer) {
    throw new ApiError(
      409,
      'This intern already has an active offer.'
    );
  }

  const offer = await Offer.create({
    intern,
    offeredBy: req.user._id,
    offerTitle,
    department: department || internRecord.department,
    internshipType,
    stipend: stipend || 0,
    joiningDate,
    internshipEndDate,
    status: 'draft',
    notes,
  });

  await logAction({
    user: req.user._id,
    action: 'OFFER_CREATED',
    entity: 'Offer',
    entityId: offer._id,
    metadata: {
      intern,
      offerTitle,
      internshipType,
    },
    ipAddress: req.ip,
  });

  const populatedOffer = await Offer.findById(offer._id)
    .populate('intern', 'fullName email department status')
    .populate('department', 'name')
    .populate('offeredBy', 'email role');

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        populatedOffer,
        'Offer created successfully'
      )
    );
});

// PUT /api/offers/:id
// HR/Admin only
const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  if (['accepted', 'rejected'].includes(offer.status)) {
    throw new ApiError(
      400,
      'Accepted or rejected offers cannot be edited.'
    );
  }

  const allowedFields = [
    'offerTitle',
    'department',
    'internshipType',
    'stipend',
    'joiningDate',
    'internshipEndDate',
    'notes',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      offer[field] = req.body[field];
    }
  });

  if (
    offer.internshipEndDate &&
    offer.joiningDate &&
    new Date(offer.internshipEndDate) <= new Date(offer.joiningDate)
  ) {
    throw new ApiError(
      400,
      'Internship end date must be after the joining date.'
    );
  }

  await offer.save();

  await logAction({
    user: req.user._id,
    action: 'OFFER_UPDATED',
    entity: 'Offer',
    entityId: offer._id,
    metadata: req.body,
    ipAddress: req.ip,
  });

  res.json(
    new ApiResponse(
      200,
      offer,
      'Offer updated successfully'
    )
  );
});

// PUT /api/offers/:id/send
// HR/Admin only
const sendOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  if (offer.status !== 'draft') {
    throw new ApiError(
      400,
      'Only draft offers can be sent.'
    );
  }

  offer.status = 'offered';
  offer.offeredAt = new Date();

  await offer.save();

  await logAction({
    user: req.user._id,
    action: 'OFFER_SENT',
    entity: 'Offer',
    entityId: offer._id,
    ipAddress: req.ip,
  });

  res.json(
    new ApiResponse(
      200,
      offer,
      'Offer sent successfully'
    )
  );
});

// PUT /api/offers/:id/accept
// Intern only
const acceptOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  if (String(offer.intern) !== String(req.user.profileRef)) {
    throw new ApiError(
      403,
      'You can only accept your own offer.'
    );
  }

  if (offer.status !== 'offered') {
    throw new ApiError(
      400,
      'Only an offered offer can be accepted.'
    );
  }

  offer.status = 'accepted';
  offer.respondedAt = new Date();

  await offer.save();

  const intern = await Intern.findById(offer.intern);

  if (!intern) {
    throw new ApiError(404, 'Intern profile not found');
  }

  intern.status = 'active';
  intern.joiningDate = offer.joiningDate;
  intern.internshipEndDate = offer.internshipEndDate;
  intern.internshipType = offer.internshipType;

  if (offer.department) {
    intern.department = offer.department;
  }

  intern.profileComplete = true;

  await intern.save();

  // Create the onboarding record automatically after offer acceptance.
  const onboarding = await Onboarding.findOneAndUpdate(
    {
      intern: intern._id,
    },
    {
      intern: intern._id,
      offer: offer._id,
      status: 'not_started',
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  await logAction({
    user: req.user._id,
    action: 'OFFER_ACCEPTED',
    entity: 'Offer',
    entityId: offer._id,
    metadata: {
      intern: intern._id,
      onboarding: onboarding._id,
    },
    ipAddress: req.ip,
  });

  res.json(
    new ApiResponse(
      200,
      {
        offer,
        intern,
        onboarding,
      },
      'Offer accepted successfully'
    )
  );
});

// PUT /api/offers/:id/reject
// Intern only
const rejectOffer = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  if (String(offer.intern) !== String(req.user.profileRef)) {
    throw new ApiError(
      403,
      'You can only reject your own offer.'
    );
  }

  if (offer.status !== 'offered') {
    throw new ApiError(
      400,
      'Only an offered offer can be rejected.'
    );
  }

  offer.status = 'rejected';
  offer.respondedAt = new Date();
  offer.rejectionReason = rejectionReason || '';

  await offer.save();

  await logAction({
    user: req.user._id,
    action: 'OFFER_REJECTED',
    entity: 'Offer',
    entityId: offer._id,
    metadata: {
      rejectionReason: rejectionReason || '',
    },
    ipAddress: req.ip,
  });

  res.json(
    new ApiResponse(
      200,
      offer,
      'Offer rejected successfully'
    )
  );
});

// PUT /api/offers/:id/withdraw
// HR/Admin only
const withdrawOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  if (!['draft', 'offered'].includes(offer.status)) {
    throw new ApiError(
      400,
      'Only draft or offered offers can be withdrawn.'
    );
  }

  offer.status = 'withdrawn';

  await offer.save();

  await logAction({
    user: req.user._id,
    action: 'OFFER_WITHDRAWN',
    entity: 'Offer',
    entityId: offer._id,
    ipAddress: req.ip,
  });

  res.json(
    new ApiResponse(
      200,
      offer,
      'Offer withdrawn successfully'
    )
  );
});

module.exports = {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  sendOffer,
  acceptOffer,
  rejectOffer,
  withdrawOffer,
};