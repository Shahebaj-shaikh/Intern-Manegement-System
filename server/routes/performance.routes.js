const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/performance.controller');

router.use(protect);

// Performance Dashboard
router.get('/dashboard/:internId?', c.getDashboard);

// Evaluation Templates (Configurable Categories)
router.get('/templates', c.getTemplates);
router.get('/templates/:id', c.getTemplateById);
router.post('/templates', authorize('super_admin', 'hr'), c.createTemplate);
router.put('/templates/:id', authorize('super_admin', 'hr'), c.updateTemplate);
router.delete('/templates/:id', authorize('super_admin', 'hr'), c.deleteTemplate);

// Standalone Evaluation Categories
router.get('/categories', c.getCategories);
router.post('/categories', authorize('super_admin', 'hr'), c.createCategory);
router.put('/categories/:id', authorize('super_admin', 'hr'), c.updateCategory);
router.delete('/categories/:id', authorize('super_admin', 'hr'), c.deleteCategory);

// Continuous Feedback
router.get('/feedback', c.getFeedback);
router.post('/feedback', authorize('team_lead', 'hr', 'super_admin'), c.createFeedback);

// Mid-Term & Periodic Evaluations
router.get('/evaluations', c.getEvaluations);
router.get('/evaluations/:id', c.getEvaluationById);
router.post('/evaluations', authorize('team_lead', 'hr', 'super_admin'), c.createEvaluation);
router.put('/evaluations/:id', authorize('team_lead', 'hr', 'super_admin'), c.updateEvaluation);
router.put('/evaluations/:id/finalize', authorize('team_lead', 'hr', 'super_admin'), c.finalizeEvaluation);
router.get('/evaluations/:id/history', c.getEvaluationHistory);

// Backwards-compatibility aliases for legacy routes
router.get('/', c.getEvaluations);
router.post('/', authorize('team_lead', 'hr', 'super_admin'), c.createEvaluation);

module.exports = router;
