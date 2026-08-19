const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    minScore: { type: Number, default: 1 },
    maxScore: { type: Number, default: 10 },
    weight: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const evaluationTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    categories: [categorySchema],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EvaluationTemplate', evaluationTemplateSchema);
