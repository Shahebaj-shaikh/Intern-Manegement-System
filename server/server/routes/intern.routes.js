const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/intern.controller');

router.use(protect);
router.get('/', authorize('super_admin', 'hr', 'team_lead'), c.getInterns);
router.get('/:id', authorize('super_admin', 'hr', 'team_lead', 'intern'), c.getInternById);
router.post('/', authorize('super_admin', 'hr'), c.createIntern);
router.put('/:id', authorize('super_admin', 'hr'), c.updateIntern);
router.delete('/:id', authorize('super_admin', 'hr'), c.deleteIntern);

module.exports = router;
