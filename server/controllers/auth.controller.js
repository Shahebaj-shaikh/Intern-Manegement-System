const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const Intern = require('../models/Intern');
const Employee = require('../models/Employee');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const sendEmail = require('../utils/sendEmail');
const logAction = require('../utils/auditLogger');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// POST /api/auth/register  (public self-signup - interns only)
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) throw new ApiError(400, 'Full name, email, and password are required.');
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters.');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = await User.create({ email: email.toLowerCase(), password: hashedPassword, role: 'intern' });

  // Self-registered interns start with placeholder dates and no department/team lead -
  // HR reviews and completes the profile before the internship officially begins.
  const today = new Date();
  const placeholderEnd = new Date(today);
  placeholderEnd.setMonth(placeholderEnd.getMonth() + 6);

  const intern = await Intern.create({
    user: newUser._id,
    email: email.toLowerCase(),
    fullName,
    joiningDate: today,
    internshipEndDate: placeholderEnd,
    status: 'upcoming',
    profileComplete: false,
  });

  newUser.profileRef = intern._id;
  newUser.profileModel = 'Intern';
  await newUser.save();

  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);
  newUser.refreshToken = refreshToken;
  newUser.lastLogin = new Date();
  await newUser.save();

  await logAction({ user: newUser._id, action: 'INTERN_SELF_REGISTERED', entity: 'Intern', entityId: intern._id, ipAddress: req.ip });

  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.status(201).json(
    new ApiResponse(201, {
      accessToken,
      user: { id: newUser._id, email: newUser.email, role: newUser.role, profile: intern },
    }, 'Account created successfully. HR will review and complete your profile shortly.')
  );
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required.');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials.');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials.');

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  let profile = null;
  if (user.profileModel === 'Intern') profile = await Intern.findById(user.profileRef);
  if (user.profileModel === 'Employee') profile = await Employee.findById(user.profileRef);

  await logAction({ user: user._id, action: 'LOGIN', entity: 'User', entityId: user._id, ipAddress: req.ip });

  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.json(
    new ApiResponse(200, {
      accessToken,
      user: { id: user._id, email: user.email, role: user.role, profile },
    }, 'Login successful')
  );
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await User.updateOne({ refreshToken: token }, { $unset: { refreshToken: 1 } });
  }
  res.clearCookie('refreshToken', cookieOptions);
  if (req.user) {
    await logAction({ user: req.user._id, action: 'LOGOUT', entity: 'User', entityId: req.user._id, ipAddress: req.ip });
  }
  res.json(new ApiResponse(200, null, 'Logged out'));
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token provided.');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) throw new ApiError(401, 'Refresh token mismatch. Please log in again.');

  const accessToken = generateAccessToken(user);
  res.json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.profileModel === 'Intern') profile = await Intern.findById(req.user.profileRef).populate('department teamLeader');
  if (req.user.profileModel === 'Employee') profile = await Employee.findById(req.user.profileRef).populate('department');

  res.json(new ApiResponse(200, { id: req.user._id, email: req.user.email, role: req.user.role, profile }));
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Both current and new password are required.');
  if (newPassword.length < 8) throw new ApiError(400, 'New password must be at least 8 characters.');

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new ApiError(401, 'Current password is incorrect.');

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  await logAction({ user: user._id, action: 'PASSWORD_CHANGED', entity: 'User', entityId: user._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, null, 'Password changed successfully'));
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  // Always respond the same way, whether or not the user exists (avoid email enumeration)
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your IMS password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
    });
  }
  res.json(new ApiResponse(200, null, 'If an account with that email exists, a reset link has been sent.'));
});

// PUT /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters.');

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new ApiError(400, 'Reset token is invalid or has expired.');

  user.password = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json(new ApiResponse(200, null, 'Password reset successfully. Please log in.'));
});

module.exports = { register, login, logout, refresh, getMe, changePassword, forgotPassword, resetPassword };
