const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Intern = require('../models/Intern');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const TaskSubmission = require('../models/TaskSubmission');

// GET /api/dashboard/admin
const adminDashboard = asyncHandler(async (req, res) => {
  const [totalInterns, activeInterns, completedInterns, totalEmployees, departments, pendingLeaves, pendingReviews, tasksByStatus, internsByDept] =
    await Promise.all([
      Intern.countDocuments(),
      Intern.countDocuments({ status: 'active' }),
      Intern.countDocuments({ status: 'completed' }),
      Employee.countDocuments(),
      Department.countDocuments({ isActive: true }),
      Leave.countDocuments({ status: 'pending' }),
      TaskSubmission.countDocuments({ reviewStatus: 'pending' }),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Intern.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      ]),
    ]);

  const totalTasks = tasksByStatus.reduce((sum, t) => sum + t.count, 0);
  const completedTasks = tasksByStatus.find((t) => t._id === 'completed')?.count || 0;
  const taskCompletionRate = totalTasks ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;

  res.json(
    new ApiResponse(200, {
      totalInterns,
      activeInterns,
      completedInterns,
      totalEmployees,
      departments,
      pendingLeaves,
      pendingReviews,
      taskCompletionRate,
      tasksByStatus,
      internsByDepartment: internsByDept.map((d) => ({ name: d.dept[0]?.name || 'Unassigned', count: d.count })),
    })
  );
});

// GET /api/dashboard/team-lead
const teamLeadDashboard = asyncHandler(async (req, res) => {
  const employeeId = req.user.profileRef;
  const interns = await Intern.find({ teamLeader: employeeId }).select('_id');
  const internIds = interns.map((i) => i._id);

  const [activeTasks, pendingSubmissions, completedTasks, overdueTasks, upcoming] = await Promise.all([
    Task.countDocuments({ assignedTo: { $in: internIds }, status: { $in: ['not_started', 'in_progress'] } }),
    TaskSubmission.countDocuments({ reviewStatus: 'pending' }),
    Task.countDocuments({ assignedTo: { $in: internIds }, status: 'completed' }),
    Task.countDocuments({ assignedTo: { $in: internIds }, deadline: { $lt: new Date() }, status: { $nin: ['completed'] } }),
    Task.find({ assignedTo: { $in: internIds }, status: { $ne: 'completed' } }).sort('deadline').limit(5).populate('assignedTo', 'fullName'),
  ]);

  res.json(
    new ApiResponse(200, {
      assignedInterns: interns.length,
      activeTasks,
      pendingSubmissions,
      completedTasks,
      overdueTasks,
      upcomingDeadlines: upcoming,
    })
  );
});

// GET /api/dashboard/intern
const internDashboard = asyncHandler(async (req, res) => {
  const internId = req.user.profileRef;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [profile, todayAttendance, tasks, pendingLeave, upcoming] = await Promise.all([
    Intern.findById(internId).populate('department teamLeader'),
    Attendance.findOne({ intern: internId, date: today }),
    Task.find({ assignedTo: internId }),
    Leave.countDocuments({ intern: internId, status: 'pending' }),
    Task.find({ assignedTo: internId, status: { $ne: 'completed' } }).sort('deadline').limit(5),
  ]);

  const pendingTasks = tasks.filter((t) => !['completed'].includes(t.status)).length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  res.json(
    new ApiResponse(200, {
      profile,
      todayAttendance,
      totalTasks: tasks.length,
      pendingTasks,
      completedTasks,
      pendingLeaveRequests: pendingLeave,
      upcomingDeadlines: upcoming,
    })
  );
});

module.exports = { adminDashboard, teamLeadDashboard, internDashboard };
