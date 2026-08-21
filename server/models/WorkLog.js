const mongoose = require('mongoose');

const workLogSchema = new mongoose.Schema(
  {
    intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0.25, max: 24 },
    workCompleted: { type: String, required: true, trim: true },
    nextSteps: { type: String, default: '' },
    blockers: { type: String, default: '' },
    managerComment: { type: String, default: '' },
    important: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

workLogSchema.index({ intern: 1, date: -1 });
workLogSchema.index({ task: 1, date: -1 });

module.exports = mongoose.model('WorkLog', workLogSchema);
