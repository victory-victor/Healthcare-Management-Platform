const express = require('express');
const router = express.Router();
const symptomController = require('../controllers/symptomController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.post('/analyze', aiLimiter, symptomController.analyze);
router.get('/history', symptomController.getHistory);
router.get('/:id', symptomController.getById);
router.delete('/:id', symptomController.deleteById);

module.exports = router;
