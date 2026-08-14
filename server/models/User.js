const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['super_admin', 'hr', 'team_lead', 'intern'], required: true },
    profileRef: { type: mongoose.Schema.Types.ObjectId, refPath: 'profileModel' },
    profileModel: { type: String, enum: ['Intern', 'Employee'] },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
