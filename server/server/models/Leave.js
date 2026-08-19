const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, enum: ['Sick', 'Casual', 'Unpaid', 'Emergency'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  supportingDocument: { type: String }, // File path / URL
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  rejectionReason: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);