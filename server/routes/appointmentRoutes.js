const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', appointmentController.bookAppointment);
router.get('/', appointmentController.getAppointments);
router.put('/:id', appointmentController.updateStatus);
router.delete('/:id', appointmentController.cancelAppointment);

module.exports = router;
