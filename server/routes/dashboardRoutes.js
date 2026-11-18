const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overview', dashboardController.getOverview);
router.get('/health-metrics', dashboardController.getHealthMetrics);
router.post('/health-metrics', dashboardController.addHealthMetric);

module.exports = router;
