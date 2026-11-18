const dbAdapter = require('../services/dbAdapter');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get user privacy consents
// @route   GET /api/privacy/consents
exports.getConsents = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let consents = await dbAdapter.find('ConsentRecord', { user: userId });

    if (consents.length === 0) {
      // Seed initial consent states
      const types = ['medical_data_processing', 'ai_analysis', 'notifications', 'telehealth_terms'];
      for (const t of types) {
        const item = await dbAdapter.create('ConsentRecord', {
          user: userId,
          consentType: t,
          isGranted: true
        });
        consents.push(item);
      }
    }

    res.status(200).json({
      success: true,
      consents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update privacy consent
// @route   PUT /api/privacy/consents
exports.updateConsent = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { consentType, isGranted } = req.body;

    let record = await dbAdapter.findOne('ConsentRecord', { user: userId, consentType });
    if (record) {
      record = await dbAdapter.findByIdAndUpdate('ConsentRecord', record._id || record.id, {
        isGranted: Boolean(isGranted),
        ...(isGranted ? { grantedAt: new Date() } : { revokedAt: new Date() })
      });
    } else {
      record = await dbAdapter.create('ConsentRecord', {
        user: userId,
        consentType,
        isGranted: Boolean(isGranted)
      });
    }

    logAudit(req, 'PRIVACY_CONSENT_MODIFIED', 'ConsentRecord', record._id || record.id, { consentType, isGranted });

    res.status(200).json({
      success: true,
      message: `Consent for ${consentType} updated.`,
      consent: record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient security audit logs
// @route   GET /api/privacy/audit-logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const logs = await dbAdapter.find('AuditLog', { user: userId }, { createdAt: -1 }, 50);

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export patient personal data archive (DPDP / GDPR Data Portability)
// @route   GET /api/privacy/export-data
exports.exportUserData = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const [
      user,
      profile,
      reports,
      prescriptions,
      appointments,
      symptoms,
      dietPlans,
      metrics
    ] = await Promise.all([
      dbAdapter.findById('User', userId),
      dbAdapter.findOne('PatientProfile', { user: userId }),
      dbAdapter.find('MedicalReport', { user: userId }),
      dbAdapter.find('Prescription', { user: userId }),
      dbAdapter.find('Appointment', { patient: userId }),
      dbAdapter.find('SymptomAnalysisResult', { user: userId }),
      dbAdapter.find('DietPlan', { user: userId }),
      dbAdapter.find('HealthMetric', { user: userId })
    ]);

    logAudit(req, 'PERSONAL_DATA_EXPORTED', 'User', userId);

    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      platform: 'MedAI Nexus Smart Healthcare Platform',
      complianceFramework: 'DPDP / GDPR Data Subject Access Request (DSAR)',
      patientAccount: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      patientMedicalProfile: profile,
      medicalReports: reports,
      prescriptions,
      appointments,
      symptomAnalyses: symptoms,
      dietPlans,
      recordedVitalMetrics: metrics
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=medai_nexus_records_${userId}.json`);
    res.status(200).json(exportPayload);
  } catch (error) {
    next(error);
  }
};
