const router = require('express').Router();

const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/onboarding.controller');

router.use(protect);

// HR/Admin can view all onboarding records.
// Intern can view only their own record.
router.get(
  '/',
  authorize('super_admin', 'hr', 'intern'),
  c.getOnboardings
);

// View one onboarding record
router.get(
  '/:id',
  authorize('super_admin', 'hr', 'intern'),
  c.getOnboardingById
);

// View onboarding progress
router.get(
  '/:id/progress',
  authorize('super_admin', 'hr', 'intern'),
  c.getOnboardingProgress
);

// HR/Admin actions
router.put(
  '/:id',
  authorize('super_admin', 'hr'),
  c.updateOnboarding
);

router.put(
  '/:id/start',
  authorize('super_admin', 'hr'),
  c.startOnboarding
);

router.put(
  '/:id/complete',
  authorize('super_admin', 'hr'),
  c.completeOnboarding
);

module.exports = router;