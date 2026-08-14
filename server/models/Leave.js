const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
    leaveType: { type: String, enum: ['sick', 'casual', 'emergency', 'other'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    attachment: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    reviewComment: String,
  },
  { timestamps: true }
);

leaveSchema.index({ intern: 1, status: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
