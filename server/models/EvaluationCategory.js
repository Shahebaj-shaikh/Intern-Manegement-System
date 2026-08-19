const mongoose = require('mongoose');

const evaluationCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    minScore: { type: Number, default: 1 },
    maxScore: { type: Number, default: 10 },
    weight: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EvaluationCategory', evaluationCategorySchema);
