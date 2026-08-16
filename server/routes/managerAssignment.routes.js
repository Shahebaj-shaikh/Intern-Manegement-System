const router = require('express').Router();

const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');

const {
  getManagers,
  getInternsWithManagers,
  assignManager,
  removeManager,
  getAssignmentHistory,
} = require('../controllers/managerAssignment.controller');

router.use(protect);

// HR + Super Admin can view manager/intern assignment data
router.get(
  '/managers',
  authorize('super_admin', 'hr'),
  getManagers
);

router.get(
  '/interns',
  authorize('super_admin', 'hr'),
  getInternsWithManagers
);

// Only HR + Super Admin can modify assignments
router.put(
  '/:internId',
  authorize('super_admin', 'hr'),
  assignManager
);

router.delete(
  '/:internId',
  authorize('super_admin', 'hr'),
  removeManager
);

// Assignment history
router.get(
  '/:internId/history',
  authorize('super_admin', 'hr'),
  getAssignmentHistory
);

module.exports = router;