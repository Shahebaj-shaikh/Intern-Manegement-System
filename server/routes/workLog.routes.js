const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/workLog.controller');

router.use(protect);
router.get('/', c.getWorkLogs);
router.post('/', authorize('intern'), c.createWorkLog);
router.get('/:id', c.getWorkLogById);
router.put('/:id', authorize('intern'), c.updateWorkLog);
router.put('/:id/review', authorize('team_lead', 'hr', 'super_admin'), c.reviewWorkLog);
router.delete('/:id', c.deleteWorkLog);

module.exports = router;
