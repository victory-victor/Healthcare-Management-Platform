const express = require('express');
const router = express.Router();
const privacyController = require('../controllers/privacyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/consents', privacyController.getConsents);
router.put('/consents', privacyController.updateConsent);
router.get('/audit-logs', privacyController.getAuditLogs);
router.get('/export-data', privacyController.exportUserData);

module.exports = router;
