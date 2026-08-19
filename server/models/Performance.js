const mongoose = require('mongoose');

const categoryScoreSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationCategory' },
    categoryName: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, default: 10 },
    weight: { type: Number, default: 1 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const versionSnapshotSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedAt: { type: Date, default: Date.now },
    status: { type: String },
    overallScore: { type: Number },
    categoryScores: [categoryScoreSchema],
    strengths: { type: String, default: '' },
    weaknesses: { type: String, default: '' },
    improvementPlan: { type: String, default: '' },
    overallRecommendation: { type: String, default: '' },
    changeSummary: { type: String, default: '' },
  },
  { _id: true }
);

const performanceSchema = new mongoose.Schema(
  {
    intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
    evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // backwards-compatibility
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationTemplate' },
    evaluationPeriod: { type: String, required: true, default: 'Mid-Term' },
    categoryScores: [categoryScoreSchema],
    strengths: { type: String, default: '' },
    weaknesses: { type: String, default: '' },
    improvementPlan: { type: String, default: '' },
    overallRecommendation: {
      type: String,
      enum: ['excellent', 'satisfactory', 'needs_improvement', 'terminate', 'exceptional', 'good', ''],
      default: 'satisfactory',
    },
    overallScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'finalized'],
      default: 'draft',
    },
    submittedAt: Date,
    finalizedAt: Date,
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 },
    versionHistory: [versionSnapshotSchema],
    feedback: { type: String, default: '' }, // backwards-compatibility if referenced
  },
  { timestamps: true }
);

// Pre-save calculate overallScore if categoryScores are present
performanceSchema.pre('save', function (next) {
  if (this.categoryScores && this.categoryScores.length > 0) {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    this.categoryScores.forEach((item) => {
      const weight = item.weight || 1;
      const max = item.maxScore || 10;
      // normalize to 10-point scale
      const normalizedScore = (item.score / max) * 10;
      totalWeightedScore += normalizedScore * weight;
      totalWeight += weight;
    });

    this.overallScore = totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(2)) : 0;
  }
  next();
});

performanceSchema.index({ intern: 1, evaluationPeriod: 1 });
performanceSchema.index({ status: 1 });

module.exports = mongoose.model('Performance', performanceSchema);
