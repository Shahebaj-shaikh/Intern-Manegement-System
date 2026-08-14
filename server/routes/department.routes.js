const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/department.controller');

router.use(protect);
router.get('/', c.getDepartments);
router.post('/', authorize('super_admin', 'hr'), c.createDepartment);
router.put('/:id', authorize('super_admin', 'hr'), c.updateDepartment);
router.delete('/:id', authorize('super_admin', 'hr'), c.deleteDepartment);

module.exports = router;
