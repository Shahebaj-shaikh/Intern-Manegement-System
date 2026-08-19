const mongoose = require('mongoose');

const internSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    profilePicture: String,
    phone: String,
    college: String,
    degree: String,
    branch: String,
    graduationYear: Number,
    skills: [String],
    address: String,
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    internshipType: { type: String, enum: ['unpaid', 'paid', 'stipend'], default: 'unpaid' },
    joiningDate: { type: Date, required: true },
    internshipEndDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed', 'terminated'],
      default: 'upcoming',
    },
    // true until HR reviews a self-registered account and fills in department/team lead/dates
    profileComplete: { type: Boolean, default: true },
  },
  { timestamps: true }
);

internSchema.index({ department: 1, status: 1 });
internSchema.index({ teamLeader: 1 });
internSchema.index({ fullName: 'text', email: 'text', college: 'text' });

module.exports = mongoose.model('Intern', internSchema);
