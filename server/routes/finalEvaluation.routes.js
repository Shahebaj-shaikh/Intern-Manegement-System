const router = require('express').Router();

const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/finalEvaluation.controller');

router.use(protect);

// HR, Team Lead and Super Admin can create final evaluations
router.post(
  '/',
  authorize('hr', 'team_lead', 'super_admin'),
  c.createFinalEvaluation
);

// HR, Team Lead and Super Admin can view evaluations
router.get(
  '/',
  authorize('hr', 'team_lead', 'super_admin'),
  c.getFinalEvaluations
);

// Get final evaluation of a particular intern
router.get(
  '/:internId',
  authorize('hr', 'team_lead', 'super_admin'),
  c.getFinalEvaluation
);

module.exports = router;