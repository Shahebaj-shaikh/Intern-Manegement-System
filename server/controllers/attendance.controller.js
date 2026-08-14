const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Attendance = require('../models/Attendance');
const logAction = require('../utils/auditLogger');

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// POST /api/attendance/check-in
const checkIn = asyncHandler(async (req, res) => {
  const internId = req.user.profileRef;
  const today = startOfDay();

  const existing = await Attendance.findOne({ intern: internId, date: today });
  if (existing && existing.checkIn) throw new ApiError(409, 'You have already checked in today.');

  const record = existing || new Attendance({ intern: internId, date: today });
  record.checkIn = new Date();
  record.status = 'present';
  await record.save();

  res.status(201).json(new ApiResponse(201, record, 'Checked in successfully'));
});

// POST /api/attendance/check-out
const checkOut = asyncHandler(async (req, res) => {
  const internId = req.user.profileRef;
  const today = startOfDay();

  const record = await Attendance.findOne({ intern: internId, date: today });
  if (!record || !record.checkIn) throw new ApiError(400, 'You must check in before checking out.');
  if (record.checkOut) throw new ApiError(409, 'You have already checked out today.');

  record.checkOut = new Date();
  const hours = (record.checkOut - record.checkIn) / (1000 * 60 * 60);
  record.workingHours = Number(hours.toFixed(2));
  record.status = hours < 4 ? 'half_day' : 'present';
  await record.save();

  res.json(new ApiResponse(200, record, 'Checked out successfully'));
});

// GET /api/attendance?intern=&department=&from=&to=
const getAttendance = asyncHandler(async (req, res) => {
  const { intern, from, to, page = 1, limit = 31 } = req.query;
  const filter = {};

  if (req.user.role === 'intern') {
    filter.intern = req.user.profileRef;
  } else if (intern) {
    filter.intern = intern;
  }

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    Attendance.find(filter).populate('intern', 'fullName department').sort('-date').skip(skip).limit(Number(limit)),
    Attendance.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { records, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

// GET /api/attendance/summary/:internId - attendance percentage
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const internId = req.params.internId || req.user.profileRef;
  const total = await Attendance.countDocuments({ intern: internId });
  const present = await Attendance.countDocuments({ intern: internId, status: { $in: ['present', 'half_day'] } });
  const percentage = total ? Number(((present / total) * 100).toFixed(1)) : 0;
  res.json(new ApiResponse(200, { total, present, percentage }));
});

module.exports = { checkIn, checkOut, getAttendance, getAttendanceSummary };
