const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/certificate.controller');

// Public verification endpoint
router.get('/verify/:certificateId', c.verifyCertificate);

router.use(protect);
router.get('/', c.getCertificates);
router.post('/:internId/generate', authorize('hr', 'super_admin'), c.generateCertificate);

module.exports = router;
