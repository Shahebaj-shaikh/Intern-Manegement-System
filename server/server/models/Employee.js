const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    profilePicture: String,
    phone: String,
    designation: String,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

employeeSchema.index({ fullName: 'text', email: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
