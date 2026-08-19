const Notification = require('../models/Notification');

// Central place to create notifications so every module stays consistent
const notify = async ({ user, type, title, message, link }) => {
  return Notification.create({ user, type, title, message, link });
};

module.exports = { notify };
