const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');

router.get('/', doctorController.getDoctors);
router.get('/specialties', doctorController.getSpecialties);
router.get('/dashboard/overview', protect, doctorController.getDoctorDashboard);
router.get('/dashboard/patients', protect, doctorController.getDoctorPatients);
router.put('/dashboard/profile', protect, doctorController.updateDoctorProfile);
router.put('/dashboard/availability', protect, doctorController.updateDoctorAvailability);
router.post('/dashboard/prescribe', protect, doctorController.issuePrescription);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/availability', doctorController.getAvailability);

module.exports = router;
