const mongoose = require('mongoose');

const finalEvaluationSchema = new mongoose.Schema(
  {
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
    },

    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    attendanceSummary: {
      totalDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      leaveDays: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 0 },
    },

    taskSummary: {
      totalTasks: { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
      taskCompletionPercentage: { type: Number, default: 0 },
    },

    performanceSummary: {
      overallScore: { type: Number, default: 0 },
      feedback: String,
    },

    workLogSummary: {
      totalHours: { type: Number, default: 0 },
    },

    feedbackSummary: String,

    outcome: {
      type: String,
      enum: ['COMPLETED', 'EXTENDED', 'TERMINATED'],
      required: true,
    },

    evaluationDate: {
      type: Date,
      default: Date.now,
    },

    comments: String,
  },
  { timestamps: true }
);

finalEvaluationSchema.index({ intern: 1 });

module.exports = mongoose.model('FinalEvaluation', finalEvaluationSchema);