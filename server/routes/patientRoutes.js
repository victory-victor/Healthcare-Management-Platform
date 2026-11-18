const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', patientController.getProfile);
router.put('/profile', patientController.updateProfile);
router.delete('/account', patientController.deleteAccount);

module.exports = router;
