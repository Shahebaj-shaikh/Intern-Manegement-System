const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
    files: [String],
    notes: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    reviewStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    feedback: String,
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaskSubmission', taskSubmissionSchema);
