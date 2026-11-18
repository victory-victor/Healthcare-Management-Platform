const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.post('/upload', upload.single('prescriptionFile'), aiLimiter, prescriptionController.uploadPrescription);
router.get('/', prescriptionController.getPrescriptions);
router.get('/reminders', prescriptionController.getReminders);
router.put('/reminders/:id/status', prescriptionController.updateReminderStatus);
router.get('/:id', prescriptionController.getPrescriptionById);
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router;
