const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
    certificateId: { type: String, required: true, unique: true },
    role: String,
    durationText: String,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    filePath: String,
    issueDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
