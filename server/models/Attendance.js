const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
    date: { type: Date, required: true },
    checkIn: Date,
    checkOut: Date,
    workingHours: Number,
    status: { type: String, enum: ['present', 'absent', 'half_day', 'leave'], default: 'present' },
  },
  { timestamps: true }
);

attendanceSchema.index({ intern: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
