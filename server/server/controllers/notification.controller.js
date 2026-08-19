const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Notification = require('../models/Notification');

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json(new ApiResponse(200, { notifications, unreadCount }));
});

const markAsRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { isRead: true });
  res.json(new ApiResponse(200, null, 'Marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json(new ApiResponse(200, null, 'All notifications marked as read'));
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
