const { Parser } = require('json2csv');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Intern = require('../models/Intern');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Task = require('../models/Task');
const Performance = require('../models/Performance');

const toCsvOrJson = (res, rows, filename, format) => {
  if (format === 'csv') {
    const parser = new Parser();
    const csv = parser.parse(rows.map((r) => (r.toObject ? r.toObject() : r)));
    res.header('Content-Type', 'text/csv');
    res.attachment(`${filename}.csv`);
    return res.send(csv);
  }
  res.json(new ApiResponse(200, rows));
};

// GET /api/reports/interns?format=csv|json&department=&status=
const internReport = asyncHandler(async (req, res) => {
  const { department, status, format = 'json' } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (status) filter.status = status;
  const interns = await Intern.find(filter).populate('department', 'name').populate('teamLeader', 'fullName').lean();
  toCsvOrJson(res, interns, 'intern-report', format);
});

const attendanceReport = asyncHandler(async (req, res) => {
  const { from, to, intern, format = 'json' } = req.query;
  const filter = {};
  if (intern) filter.intern = intern;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const records = await Attendance.find(filter).populate('intern', 'fullName').lean();
  toCsvOrJson(res, records, 'attendance-report', format);
});

const leaveReport = asyncHandler(async (req, res) => {
  const { status, format = 'json' } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const leaves = await Leave.find(filter).populate('intern', 'fullName').lean();
  toCsvOrJson(res, leaves, 'leave-report', format);
});

const taskReport = asyncHandler(async (req, res) => {
  const { status, format = 'json' } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const tasks = await Task.find(filter).populate('assignedTo', 'fullName').populate('createdBy', 'fullName').lean();
  toCsvOrJson(res, tasks, 'task-report', format);
});

const performanceReport = asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;
  const evaluations = await Performance.find().populate('intern', 'fullName').populate('evaluatedBy', 'fullName').lean();
  toCsvOrJson(res, evaluations, 'performance-report', format);
});

module.exports = { internReport, attendanceReport, leaveReport, taskReport, performanceReport };
