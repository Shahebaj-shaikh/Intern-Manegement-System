const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/employee.controller');

router.use(protect, authorize('super_admin', 'hr'));
router.get('/', c.getEmployees);
router.get('/:id', c.getEmployeeById);
router.post('/', c.createEmployee);
router.put('/:id', c.updateEmployee);
router.delete('/:id', c.deactivateEmployee);

module.exports = router;
