const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Employee = require('../models/Employee');
const User = require('../models/User');
const logAction = require('../utils/auditLogger');

const getEmployees = asyncHandler(async (req, res) => {
  const { search, department, role, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  let employees = await Employee.find(filter).populate('department', 'name').populate('user', 'role isActive').sort('-createdAt').skip(skip).limit(Number(limit));

  if (role) employees = employees.filter((e) => e.user?.role === role);

  const total = await Employee.countDocuments(filter);
  res.json(new ApiResponse(200, { employees, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate('department').populate('user', 'role isActive email');
  if (!employee) throw new ApiError(404, 'Employee not found');
  res.json(new ApiResponse(200, employee));
});

const createEmployee = asyncHandler(async (req, res) => {
  const { email, password, fullName, role, ...rest } = req.body;
  if (!email || !password || !fullName || !role) throw new ApiError(400, 'Email, password, full name, and role are required.');
  if (!['hr', 'team_lead', 'super_admin'].includes(role)) throw new ApiError(400, 'Invalid role for employee.');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'A user with this email already exists.');

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ email: email.toLowerCase(), password: hashedPassword, role });
  const employee = await Employee.create({ user: user._id, email: email.toLowerCase(), fullName, ...rest });

  user.profileRef = employee._id;
  user.profileModel = 'Employee';
  await user.save();

  await logAction({ user: req.user._id, action: 'EMPLOYEE_CREATED', entity: 'Employee', entityId: employee._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, employee, 'Employee created successfully'));
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const { email, password, ...updates } = req.body;
  Object.assign(employee, updates);
  await employee.save();

  await logAction({ user: req.user._id, action: 'EMPLOYEE_UPDATED', entity: 'Employee', entityId: employee._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, employee, 'Employee updated successfully'));
});

const deactivateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  employee.isActive = false;
  await employee.save();
  await User.updateOne({ _id: employee.user }, { isActive: false });

  await logAction({ user: req.user._id, action: 'EMPLOYEE_DEACTIVATED', entity: 'Employee', entityId: employee._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, null, 'Employee deactivated successfully'));
});

module.exports = { getEmployees, getEmployeeById, createEmployee, updateEmployee, deactivateEmployee };
