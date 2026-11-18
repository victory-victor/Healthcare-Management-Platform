const dbAdapter = require('../services/dbAdapter');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get overall admin platform stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalAppointments,
      totalReports,
      totalSymptoms
    ] = await Promise.all([
      dbAdapter.countDocuments('User', { role: 'patient' }),
      dbAdapter.countDocuments('DoctorProfile'),
      dbAdapter.countDocuments('Appointment'),
      dbAdapter.countDocuments('MedicalReport'),
      dbAdapter.countDocuments('SymptomAnalysisResult')
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalPatients: totalUsers,
        totalDoctors,
        totalAppointments,
        totalReports,
        totalSymptomAnalyses: totalSymptoms,
        systemHealth: 'Optimal',
        aiServiceStatus: 'Active'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users for admin management
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await dbAdapter.find('User', {}, { createdAt: -1 }, 100);
    const sanitized = users.map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isEmailVerified: u.isEmailVerified,
      createdAt: u.createdAt
    }));

    res.status(200).json({
      success: true,
      count: sanitized.length,
      users: sanitized
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or unverify doctor
// @route   PUT /api/admin/doctors/:id/verify
exports.verifyDoctor = async (req, res, next) => {
  try {
    const { isVerified } = req.body;
    const doctor = await dbAdapter.findById('DoctorProfile', req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const updated = await dbAdapter.findByIdAndUpdate('DoctorProfile', req.params.id, {
      isVerified: Boolean(isVerified)
    });

    logAudit(req, 'DOCTOR_VERIFICATION_STATUS_CHANGED', 'DoctorProfile', req.params.id, { isVerified });

    res.status(200).json({
      success: true,
      message: `Doctor verification status updated to ${Boolean(isVerified)}.`,
      doctor: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform audit logs
// @route   GET /api/admin/audit-logs
exports.getPlatformAuditLogs = async (req, res, next) => {
  try {
    const logs = await dbAdapter.find('AuditLog', {}, { createdAt: -1 }, 100);
    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new medical specialty
// @route   POST /api/admin/specialties
exports.addSpecialty = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    const item = await dbAdapter.create('Specialty', {
      name,
      description,
      icon: icon || 'Stethoscope'
    });
    res.status(201).json({ success: true, specialty: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new hospital/clinic
// @route   POST /api/admin/hospitals
exports.addHospital = async (req, res, next) => {
  try {
    const hospital = await dbAdapter.create('Hospital', req.body);
    res.status(201).json({ success: true, hospital });
  } catch (error) {
    next(error);
  }
};
