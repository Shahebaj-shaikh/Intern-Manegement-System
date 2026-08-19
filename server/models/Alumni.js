const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema(
  {
    internRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alumni', alumniSchema);
