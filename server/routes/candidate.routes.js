const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const upload = require('../middlewares/upload');
const c = require('../controllers/candidate.controller');

router.use(protect, authorize('hr', 'super_admin'));

router.get('/', c.getCandidates);
router.get('/:id', c.getCandidateById);
router.post('/', upload.single('resume'), c.createCandidate);
router.put('/:id', upload.single('resume'), c.updateCandidate);
router.delete('/:id', c.archiveCandidate);
router.put('/:id/restore', c.restoreCandidate);

module.exports = router;
