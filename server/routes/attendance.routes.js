const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/attendance.controller');

router.use(protect);
router.post('/check-in', authorize('intern'), c.checkIn);
router.post('/check-out', authorize('intern'), c.checkOut);
router.get('/', c.getAttendance);
router.get('/summary/:internId?', c.getAttendanceSummary);

module.exports = router;
