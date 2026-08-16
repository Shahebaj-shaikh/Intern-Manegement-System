const mongoose = require('mongoose');

const managerAssignmentHistorySchema = new mongoose.Schema(
  {
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
    },

    previousManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    newManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    action: {
      type: String,
      enum: ['ASSIGNED', 'CHANGED', 'REMOVED'],
      required: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

managerAssignmentHistorySchema.index({ intern: 1, createdAt: -1 });

module.exports = mongoose.model(
  'ManagerAssignmentHistory',
  managerAssignmentHistorySchema
);