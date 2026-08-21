const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/completion.controller');

router.use(protect);

// Only HR and Super Admin can mark completion
router.post('/:internId/complete', authorize('hr', 'super_admin'), c.completeIntern);

module.exports = router;
