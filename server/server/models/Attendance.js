const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    intern: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    workingHours: { type: Number, default: 0 }, // In hours
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Leave', 'Holiday', 'Weekend'],
      default: 'Absent',
    },
    correctionRequest: {
      requestedCheckIn: Date,
      requestedCheckOut: Date,
      reason: String,
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String,
    },
  },
  { timestamps: true }
);

// Prevents duplicate attendance records for the same intern on the same day
attendanceSchema.index({ intern: 1, date: 1 }, { unique: true });



module.exports = mongoose.model('Attendance', attendanceSchema);
