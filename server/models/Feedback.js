const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorModel: { type: String, enum: ['User', 'Employee'], default: 'User' },
    category: { type: String, default: 'General', trim: true },
    strengths: { type: String, default: '' },
    weaknesses: { type: String, default: '' },
    improvementSuggestions: { type: String, default: '' },
    comments: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

feedbackSchema.index({ intern: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
