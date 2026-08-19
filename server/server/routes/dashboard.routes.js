const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/dashboard.controller');

router.use(protect);
router.get('/admin', authorize('super_admin', 'hr'), c.adminDashboard);
router.get('/team-lead', authorize('team_lead'), c.teamLeadDashboard);
router.get('/intern', authorize('intern'), c.internDashboard);

module.exports = router;
