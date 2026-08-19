const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/attendance.controller');

router.use(protect);

router.post('/check-in', authorize('intern'), c.checkIn);
router.post('/check-out', authorize('intern'), c.checkOut);
router.get('/', c.getAttendance);
router.get('/summary/:internId?', c.getAttendanceSummary);

// Dev-Only Testing Route
if (process.env.NODE_ENV !== 'production') {
  router.delete('/reset-today', c.resetTodayAttendance);
}
// Admin / HR Specific Routes 🛡️
router.get('/admin/all', authorize('admin', 'hr'), c.getAllAttendanceAdmin);
router.patch('/admin/correction/:recordId', authorize('admin', 'hr'), c.handleCorrectionRequest);
router.post('/admin/manual', authorize('admin', 'hr'), c.markManualAttendance);

module.exports = router;