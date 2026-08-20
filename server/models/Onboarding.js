const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema(
  {
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
      unique: true,
    },

    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
    },

    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },

    checklist: {
      profileCompleted: {
        type: Boolean,
        default: false,
      },

      offerLetterSubmitted: {
        type: Boolean,
        default: false,
      },

      collegeIdSubmitted: {
        type: Boolean,
        default: false,
      },

      joiningDocumentSubmitted: {
        type: Boolean,
        default: false,
      },
    },

    hrNotes: {
      type: String,
      trim: true,
    },

    completedAt: {
      type: Date,
    },

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

onboardingSchema.index({ status: 1 });

module.exports = mongoose.model('Onboarding', onboardingSchema);