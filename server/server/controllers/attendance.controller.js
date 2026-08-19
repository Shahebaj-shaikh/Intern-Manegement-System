const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Attendance = require('../models/Attendance');
const logAction = require('../utils/auditLogger');

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());



// POST /api/attendance/check-in
const checkIn = asyncHandler(async (req, res) => {
  const internId = req.user?.profileRef || req.user?._id || req.user?.id;
  if (!internId) {
    throw new ApiError(400, 'User profile or ID is missing from request context.');
  }
  const today = startOfDay();

  const existing = await Attendance.findOne({ intern: internId, date: today });
  if (existing && existing.checkIn) throw new ApiError(409, 'You have already checked in today.');

  const record = existing || new Attendance({ intern: internId, date: today });
  record.checkIn = new Date();
  record.status = 'Present';
  await record.save();

  res.status(201).json(new ApiResponse(201, record, 'Checked in successfully'));
});

// POST /api/attendance/check-out
// POST /api/attendance/check-out
const checkOut = asyncHandler(async (req, res) => {
  const internId = req.user?.profileRef || req.user?._id || req.user?.id;
  const today = startOfDay();

  const record = await Attendance.findOne({ intern: internId, date: today });
  if (!record || !record.checkIn) throw new ApiError(400, 'You must check in before checking out.');
  if (record.checkOut) throw new ApiError(409, 'You have already checked out today.');

  record.checkOut = new Date();
  const hours = (record.checkOut - record.checkIn) / (1000 * 60 * 60);
  record.workingHours = Number(hours.toFixed(2));
  
  // 🟢 Fixed: Always set allowed enum value 'Present'
  record.status = 'Present'; 
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
  // 🟢 Updated Line (Purana URL param search retain karte hue fallback)
  const internId = req.params.internId || req.user.profileRef || req.user._id || req.user.id;
  const total = await Attendance.countDocuments({ intern: internId });
  const present = await Attendance.countDocuments({ intern: internId, status: { $in: ['present', 'half_day'] } });
  const percentage = total ? Number(((present / total) * 100).toFixed(1)) : 0;
  res.json(new ApiResponse(200, { total, present, percentage }));
});

// Function Definition
// controllers/attendance.controller.js
// DELETE /api/attendance/reset-today (Dev Only)
// DELETE /api/attendance/reset-today (Dev Only)
const resetTodayAttendance = asyncHandler(async (req, res) => {
  const internId = req.user?.profileRef || req.user?._id || req.user?.id;

  if (!internId) {
    throw new ApiError(400, 'User context missing');
  }

  // Pure intern ke test records delete kar dega taaki clean testing ho sake
  const result = await Attendance.deleteMany({ intern: internId });

  res.json(new ApiResponse(200, result, 'Attendance reset successfully for testing!'));
});

// 1. Get All Interns Attendance (Admin / HR View) 📊
const getAllAttendanceAdmin = asyncHandler(async (req, res) => {
  const { date, status, search, page = 1, limit = 20 } = req.query;

  let query = {};

  // Date Filter (Default: Today)
  const filterDate = date ? new Date(date) : new Date();
  const start = new Date(filterDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(filterDate);
  end.setHours(23, 59, 59, 999);

  query.date = { $gte: start, $lte: end };

  if (status && status !== 'All') {
    query.status = status;
  }

  const attendanceRecords = await Attendance.find(query)
    .populate({
      path: 'intern',
      select: 'name email department avatar',
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Attendance.countDocuments(query);

  res.json(new ApiResponse(200, { records: attendanceRecords, total }, 'All attendance fetched successfully'));
});

// 2. Approve or Reject Correction Request 📝
const handleCorrectionRequest = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const { action, adminComment } = req.body; // action: 'Approved' or 'Rejected'

  if (!['Approved', 'Rejected'].includes(action)) {
    throw new ApiError(400, 'Invalid action type');
  }

  const record = await Attendance.findById(recordId);
  if (!record) throw new ApiError(404, 'Attendance record not found');

  if (!record.correctionRequest || record.correctionRequest.status !== 'Pending') {
    throw new ApiError(400, 'No pending correction request found on this record');
  }

  record.correctionRequest.status = action;
  record.correctionRequest.adminComment = adminComment || '';

  // Agar approve hua toh checkIn / checkOut times update karein
  if (action === 'Approved') {
    if (record.correctionRequest.requestedCheckIn) {
      record.checkIn = record.correctionRequest.requestedCheckIn;
    }
    if (record.correctionRequest.requestedCheckOut) {
      record.checkOut = record.correctionRequest.requestedCheckOut;
    }
    if (record.checkIn && record.checkOut) {
      const hours = (new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60 * 60);
      record.workingHours = Number(hours.toFixed(2));
    }
    record.status = 'Present';
  }

  await record.save();

  res.json(new ApiResponse(200, record, `Correction request ${action.toLowerCase()} successfully`));
});

// 3. Mark Manual Attendance / Leave (Admin Override) ✍️
const markManualAttendance = asyncHandler(async (req, res) => {
  const { internId, date, status, checkIn, checkOut, remark } = req.body;

  if (!internId || !date || !status) {
    throw new ApiError(400, 'Intern ID, Date, and Status are required');
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  let record = await Attendance.findOne({ intern: internId, date: targetDate });

  if (!record) {
    record = new Attendance({ intern: internId, date: targetDate });
  }

  record.status = status;
  if (checkIn) record.checkIn = new Date(checkIn);
  if (checkOut) record.checkOut = new Date(checkOut);
  if (remark) record.remark = remark;

  if (record.checkIn && record.checkOut) {
    const hours = (new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60 * 60);
    record.workingHours = Number(hours.toFixed(2));
  }

  await record.save();

  res.status(200).json(new ApiResponse(200, record, 'Manual attendance updated successfully'));
});

// Export all functions
module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceSummary,
  resetTodayAttendance,
  getAllAttendanceAdmin,
  handleCorrectionRequest,
  markManualAttendance,
};

