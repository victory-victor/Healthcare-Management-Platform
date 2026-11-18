const express = require('express');
const router = express.Router();
const dietController = require('../controllers/dietController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.post('/generate', aiLimiter, dietController.generatePlan);
router.get('/', dietController.getPlans);
router.get('/nutrition-logs', dietController.getNutritionLogs);
router.post('/nutrition-log', dietController.logNutrition);
router.get('/:id', dietController.getPlanById);

module.exports = router;
