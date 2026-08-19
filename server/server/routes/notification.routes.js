const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const c = require('../controllers/notification.controller');

router.use(protect);
router.get('/', c.getNotifications);
router.put('/:id/read', c.markAsRead);
router.put('/read-all', c.markAllAsRead);

module.exports = router;
