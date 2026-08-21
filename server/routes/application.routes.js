const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/application.controller');

router.use(protect, authorize('hr', 'super_admin'));

router.get('/', c.getApplications);
router.get('/:id', c.getApplicationById);
router.post('/', c.createApplication);
router.put('/:id', c.updateApplication);
router.put('/:id/status', c.updateStatus);

module.exports = router;
