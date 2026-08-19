const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/alumni.controller');

router.use(protect);
router.get('/', authorize('hr', 'super_admin', 'team_lead'), c.getAlumni);

module.exports = router;
