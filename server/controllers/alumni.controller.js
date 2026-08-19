const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Alumni = require('../models/Alumni');

// GET /api/alumni
const getAlumni = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'intern') filter.internRef = req.user.profileRef;
  const list = await Alumni.find(filter).sort('-createdAt');
  res.json(new ApiResponse(200, list));
});

module.exports = { getAlumni };
