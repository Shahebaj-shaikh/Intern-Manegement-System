const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const c = require('../controllers/document.controller');

router.use(protect);
router.get('/', c.getDocuments);
router.post('/', upload.single('file'), c.uploadDocument);
router.delete('/:id', c.deleteDocument);

module.exports = router;
