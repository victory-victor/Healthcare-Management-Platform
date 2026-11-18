const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.put('/doctors/:id/verify', adminController.verifyDoctor);
router.get('/audit-logs', adminController.getPlatformAuditLogs);
router.post('/specialties', adminController.addSpecialty);
router.post('/hospitals', adminController.addHospital);

module.exports = router;
