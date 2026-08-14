const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const upload = require('../middlewares/upload');
const c = require('../controllers/task.controller');

router.use(protect);
router.get('/', c.getTasks);
router.get('/:id', c.getTaskById);
router.post('/', authorize('team_lead', 'hr', 'super_admin'), c.createTask);
router.put('/:id', authorize('team_lead', 'hr', 'super_admin'), c.updateTask);
router.put('/:id/status', c.updateTaskStatus);
router.post('/:id/comments', c.addComment);
router.post('/:id/submit', authorize('intern'), upload.array('files', 5), c.submitTask);
router.put('/:taskId/submissions/:submissionId/review', authorize('team_lead', 'hr', 'super_admin'), c.reviewSubmission);

module.exports = router;
