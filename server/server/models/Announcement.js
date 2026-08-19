const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    targetAudience: { type: String, enum: ['all', 'interns', 'employees', 'department'], default: 'all' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
