const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.post('/upload', upload.single('reportFile'), aiLimiter, reportController.uploadReport);
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);
router.post('/:id/analyze', aiLimiter, reportController.reanalyzeReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;
