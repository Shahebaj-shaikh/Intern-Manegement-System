const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema(
  {
    intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    ratings: {
      technicalSkills: { type: Number, min: 1, max: 10 },
      taskCompletion: { type: Number, min: 1, max: 10 },
      problemSolving: { type: Number, min: 1, max: 10 },
      communication: { type: Number, min: 1, max: 10 },
      teamwork: { type: Number, min: 1, max: 10 },
      punctuality: { type: Number, min: 1, max: 10 },
      learningAbility: { type: Number, min: 1, max: 10 },
      professionalism: { type: Number, min: 1, max: 10 },
    },
    overallScore: Number,
    feedback: String,
    evaluationPeriod: String,
  },
  { timestamps: true }
);

performanceSchema.pre('save', function (next) {
  const r = this.ratings || {};
  const vals = Object.values(r).filter((v) => typeof v === 'number');
  this.overallScore = vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
  next();
});

module.exports = mongoose.model('Performance', performanceSchema);
