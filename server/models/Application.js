const mongoose = require('mongoose');

// Tracks a single candidate's application to a specific internship program
// (department) through the selection lifecycle:
// applied -> shortlisted -> interview -> selected | rejected
const applicationSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true }, // the program applied to
    positionTitle: { type: String, trim: true }, // e.g. "Frontend Development Intern"

    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview', 'selected', 'rejected'],
      default: 'applied',
    },

    interviewDate: Date,
    notes: { type: String, trim: true },

    decision: { type: String, enum: ['selected', 'rejected'] },
    decisionAt: Date,
    decisionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },

    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        changedByName: String,
        note: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

applicationSchema.index({ candidate: 1 });
applicationSchema.index({ department: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
