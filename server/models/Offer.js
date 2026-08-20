const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
    },

    offeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    offerTitle: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },

    internshipType: {
      type: String,
      enum: ['unpaid', 'paid', 'stipend'],
      required: true,
    },

    stipend: {
      type: Number,
      min: 0,
      default: 0,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    internshipEndDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ['draft', 'offered', 'accepted', 'rejected', 'withdrawn'],
      default: 'draft',
    },

    offeredAt: {
      type: Date,
    },

    respondedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

offerSchema.index({ intern: 1 });
offerSchema.index({ status: 1 });
offerSchema.index({ department: 1 });

module.exports = mongoose.model('Offer', offerSchema);