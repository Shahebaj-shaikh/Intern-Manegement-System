const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, refPath: 'ownerModel', required: true },
    ownerModel: { type: String, enum: ['Intern', 'Employee'], required: true },
    type: {
      type: String,
      enum: ['resume', 'college_id', 'offer_letter', 'joining_doc', 'certificate', 'task_doc', 'performance_report', 'other'],
      required: true,
    },
    fileName: String,
    filePath: { type: String, required: true },
    fileSize: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
