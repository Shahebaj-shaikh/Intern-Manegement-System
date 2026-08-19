const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/performance.controller');

router.use(protect);
router.get('/', c.getPerformance);
router.post('/', authorize('team_lead', 'hr', 'super_admin'), c.createEvaluation);

module.exports = router;
