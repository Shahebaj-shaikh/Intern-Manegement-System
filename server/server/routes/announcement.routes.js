const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/announcement.controller');

router.use(protect);
router.get('/', c.getAnnouncements);
router.post('/', authorize('hr', 'super_admin'), c.createAnnouncement);
router.delete('/:id', authorize('hr', 'super_admin'), c.deleteAnnouncement);

module.exports = router;
