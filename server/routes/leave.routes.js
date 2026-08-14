const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const upload = require('../middlewares/upload');
const c = require('../controllers/leave.controller');

router.use(protect);
router.get('/', c.getLeaves);
router.post('/', authorize('intern'), upload.single('attachment'), c.applyLeave);
router.put('/:id/review', authorize('team_lead', 'hr', 'super_admin'), c.reviewLeave);

module.exports = router;
