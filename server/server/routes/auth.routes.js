const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const c = require('../controllers/auth.controller');

router.post('/register', authLimiter, c.register);
router.post('/login', authLimiter, c.login);
router.post('/logout', protect, c.logout);
router.post('/refresh', c.refresh);
router.get('/me', protect, c.getMe);
router.put('/change-password', protect, c.changePassword);
router.post('/forgot-password', authLimiter, c.forgotPassword);
router.put('/reset-password/:token', c.resetPassword);

module.exports = router;
