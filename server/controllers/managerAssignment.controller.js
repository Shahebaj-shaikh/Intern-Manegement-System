const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const Intern = require('../models/Intern');
const Employee = require('../models/Employee');
const ManagerAssignmentHistory = require('../models/ManagerAssignmentHistory');
const User = require('../models/User');

const logAction = require('../utils/auditLogger');


// ============================================================
// GET /api/manager-assignments/managers
// View available Team Leaders / Managers
// ============================================================
const getManagers = asyncHandler(async (req, res) => {
  // Managers are employees whose linked User has team_lead role
  const managerUsers = await User.find({
    role: 'team_lead',
    isActive: true,
  }).select('_id email role profileRef');

  const profileRefs = managerUsers
    .map((user) => user.profileRef)
    .filter(Boolean);

  const managers = await Employee.find({
    _id: { $in: profileRefs },
    isActive: true,
  })
    .select('_id fullName email designation department user')
    .populate('department', 'name');

  res.json(
    new ApiResponse(
      200,
      { managers },
      'Managers retrieved successfully'
    )
  );
});


// ============================================================
// GET /api/manager-assignments/interns
// View interns with their current managers
// ============================================================
const getInternsWithManagers = asyncHandler(async (req, res) => {
  const interns = await Intern.find({})
    .populate('department', 'name')
    .populate('teamLeader', 'fullName email designation')
    .sort({ fullName: 1 });

  res.json(
    new ApiResponse(
      200,
      { interns },
      'Interns retrieved successfully'
    )
  );
});


// ============================================================
// PUT /api/manager-assignments/:internId
// Assign or change manager
// ============================================================
const assignManager = asyncHandler(async (req, res) => {
  const { managerId, reason } = req.body;

  if (!managerId) {
    throw new ApiError(400, 'Manager ID is required.');
  }

  // Find intern
  const intern = await Intern.findById(req.params.internId);

  if (!intern) {
    throw new ApiError(404, 'Intern not found.');
  }

  // Find selected employee
  const manager = await Employee.findById(managerId);

  if (!manager || !manager.isActive) {
    throw new ApiError(404, 'Manager not found or inactive.');
  }

  // IMPORTANT:
  // Verify that the selected employee is actually
  // connected to an active User with team_lead role.
  const managerUser = await User.findOne({
    _id: manager.user,
    role: 'team_lead',
    isActive: true,
  });

  if (!managerUser) {
    throw new ApiError(
      400,
      'Selected employee is not an eligible team leader.'
    );
  }

  // Save previous manager for history
  const previousManager = intern.teamLeader || null;

  let action = 'ASSIGNED';

  // If a manager already exists, this is a change
  if (previousManager) {
    if (String(previousManager) === String(managerId)) {
      throw new ApiError(
        400,
        'This manager is already assigned to the intern.'
      );
    }

    action = 'CHANGED';
  }

  // Update intern's manager
  intern.teamLeader = manager._id;
  await intern.save();

  // Save assignment history
  await ManagerAssignmentHistory.create({
    intern: intern._id,
    previousManager,
    newManager: manager._id,
    action,
    assignedBy: req.user._id,
    reason,
  });

  // Audit log
  await logAction({
    user: req.user._id,
    action: `MANAGER_${action}`,
    entity: 'Intern',
    entityId: intern._id,
    metadata: {
      previousManager,
      newManager: manager._id,
      reason,
    },
    ipAddress: req.ip,
  });

  // Return updated intern
  const updatedIntern = await Intern.findById(intern._id)
    .populate('department', 'name')
    .populate('teamLeader', 'fullName email designation');

  res.json(
    new ApiResponse(
      200,
      updatedIntern,
      `Manager ${action.toLowerCase()} successfully`
    )
  );
});


// ============================================================
// DELETE /api/manager-assignments/:internId
// Remove manager
// ============================================================
const removeManager = asyncHandler(async (req, res) => {
  const intern = await Intern.findById(req.params.internId);

  if (!intern) {
    throw new ApiError(404, 'Intern not found.');
  }

  if (!intern.teamLeader) {
    throw new ApiError(
      400,
      'This intern has no manager assigned.'
    );
  }

  // Store previous manager before removing
  const previousManager = intern.teamLeader;

  // Remove manager
  intern.teamLeader = null;
  await intern.save();

  // Save removal history
  await ManagerAssignmentHistory.create({
    intern: intern._id,
    previousManager,
    newManager: null,
    action: 'REMOVED',
    assignedBy: req.user._id,
  });

  // Audit log
  await logAction({
    user: req.user._id,
    action: 'MANAGER_REMOVED',
    entity: 'Intern',
    entityId: intern._id,
    metadata: {
      previousManager,
    },
    ipAddress: req.ip,
  });

  res.json(
    new ApiResponse(
      200,
      null,
      'Manager removed successfully'
    )
  );
});


// ============================================================
// GET /api/manager-assignments/:internId/history
// View manager assignment history
// ============================================================
const getAssignmentHistory = asyncHandler(async (req, res) => {
  const intern = await Intern.findById(req.params.internId);

  if (!intern) {
    throw new ApiError(404, 'Intern not found.');
  }

  const history = await ManagerAssignmentHistory.find({
    intern: intern._id,
  })
    .populate('previousManager', 'fullName email designation')
    .populate('newManager', 'fullName email designation')
    .populate('assignedBy', 'email role')
    .sort({ createdAt: -1 });

  res.json(
    new ApiResponse(
      200,
      { history },
      'Manager assignment history retrieved successfully'
    )
  );
});


// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  getManagers,
  getInternsWithManagers,
  assignManager,
  removeManager,
  getAssignmentHistory,
};