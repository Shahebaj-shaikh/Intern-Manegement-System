const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/report.controller');

router.use(protect, authorize('hr', 'super_admin', 'team_lead'));
router.get('/interns', c.internReport);
router.get('/attendance', c.attendanceReport);
router.get('/leaves', c.leaveReport);
router.get('/tasks', c.taskReport);
router.get('/performance', c.performanceReport);

module.exports = router;
