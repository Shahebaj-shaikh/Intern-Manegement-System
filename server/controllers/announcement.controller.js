const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Intern = require('../models/Intern');
const Employee = require('../models/Employee');
const logAction = require('../utils/auditLogger');
const { notify } = require('../services/notification.service');

const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().populate('createdBy', 'fullName').populate('department', 'name').sort('-createdAt').limit(50);
  res.json(new ApiResponse(200, announcements));
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, targetAudience, department } = req.body;
  if (!title) throw new ApiError(400, 'Title is required.');

  const announcement = await Announcement.create({ ...req.body, createdBy: req.user.profileRef });

  // fan out notifications to the relevant audience
  let targetUserIds = [];
  if (targetAudience === 'interns' || targetAudience === 'all') {
    const interns = await Intern.find(department ? { department } : {}).select('user');
    targetUserIds.push(...interns.map((i) => i.user));
  }
  if (targetAudience === 'employees' || targetAudience === 'all') {
    const employees = await Employee.find(department ? { department } : {}).select('user');
    targetUserIds.push(...employees.map((e) => e.user));
  }
  if (targetAudience === 'department' && department) {
    const [interns, employees] = await Promise.all([
      Intern.find({ department }).select('user'),
      Employee.find({ department }).select('user'),
    ]);
    targetUserIds.push(...interns.map((i) => i.user), ...employees.map((e) => e.user));
  }

  await Promise.all(
    targetUserIds.map((userId) =>
      notify({ user: userId, type: 'new_announcement', title: 'New announcement', message: announcement.title, link: '/announcements' })
    )
  );

  await logAction({ user: req.user._id, action: 'ANNOUNCEMENT_CREATED', entity: 'Announcement', entityId: announcement._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, announcement, 'Announcement published'));
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) throw new ApiError(404, 'Announcement not found');
  res.json(new ApiResponse(200, null, 'Announcement deleted'));
});

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
