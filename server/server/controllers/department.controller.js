const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Department = require('../models/Department');
const Intern = require('../models/Intern');
const Employee = require('../models/Employee');
const logAction = require('../utils/auditLogger');

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort('name');
  // attach counts for quick display
  const withCounts = await Promise.all(
    departments.map(async (d) => {
      const [internCount, employeeCount] = await Promise.all([
        Intern.countDocuments({ department: d._id }),
        Employee.countDocuments({ department: d._id }),
      ]);
      return { ...d.toObject(), internCount, employeeCount };
    })
  );
  res.json(new ApiResponse(200, withCounts));
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new ApiError(400, 'Department name is required.');
  const department = await Department.create({ name, description });
  await logAction({ user: req.user._id, action: 'DEPARTMENT_CREATED', entity: 'Department', entityId: department._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, department, 'Department created'));
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!department) throw new ApiError(404, 'Department not found');
  await logAction({ user: req.user._id, action: 'DEPARTMENT_UPDATED', entity: 'Department', entityId: department._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, department, 'Department updated'));
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found');
  department.isActive = false;
  await department.save();
  await logAction({ user: req.user._id, action: 'DEPARTMENT_DEACTIVATED', entity: 'Department', entityId: department._id, ipAddress: req.ip });
  res.json(new ApiResponse(200, null, 'Department deactivated'));
});

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
