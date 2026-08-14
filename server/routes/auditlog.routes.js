const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/auditlog.controller');

router.use(protect, authorize('super_admin', 'hr'));
router.get('/', c.getAuditLogs);

module.exports = router;
