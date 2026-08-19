const mongoose = require('mongoose');

// A candidate exists independently of any single application - they can apply
// to more than one internship program over time. No login/User account is
// created for candidates; recruitment is managed entirely by HR/Admin.
const candidateSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: { type: String, trim: true },

    resume: {
      fileName: String,
      filePath: String,
      fileSize: Number,
    },

    education: {
      degree: String,
      institution: String,
      branch: String,
      graduationYear: Number,
    },

    skills: [String],

    applicationDate: { type: Date, default: Date.now }, // when this candidate first came into the pipeline
    source: {
      type: String,
      enum: ['referral', 'job_portal', 'campus', 'linkedin', 'company_website', 'other'],
      default: 'other',
    },

    profileSummary: { type: String, trim: true }, // short bio / notes about the candidate

    isArchived: { type: Boolean, default: false },
    archivedAt: Date,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true } // createdAt / updatedAt
);

candidateSchema.index({ fullName: 'text', email: 'text', skills: 'text' });
candidateSchema.index({ isArchived: 1, createdAt: -1 });

module.exports = mongoose.model('Candidate', candidateSchema);
