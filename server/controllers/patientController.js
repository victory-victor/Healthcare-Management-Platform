const dbAdapter = require('../services/dbAdapter');
const { logAudit } = require('../middleware/auditLogger');
const { purgeUserData } = require('../services/accountDeletionService');

// @desc    Get patient profile
// @route   GET /api/patients/profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let profile = await dbAdapter.findOne('PatientProfile', { user: userId });

    if (!profile) {
      profile = await dbAdapter.create('PatientProfile', {
        user: userId,
        heightCm: 170,
        weightKg: 68
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        ...profile,
        user: {
          id: req.user._id || req.user.id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          avatar: req.user.avatar
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      name,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      heightCm,
      weightKg,
      allergies,
      existingConditions,
      currentMedications,
      emergencyContact,
      address,
      city,
      dietaryPreference,
      healthGoals
    } = req.body;

    // Update user root fields
    if (name || phone) {
      await dbAdapter.findByIdAndUpdate('User', userId, {
        ...(name && { name }),
        ...(phone && { phone })
      });
    }

    let profile = await dbAdapter.findOne('PatientProfile', { user: userId });
    const updatePayload = {
      ...(dateOfBirth && { dateOfBirth }),
      ...(gender && { gender }),
      ...(bloodGroup && { bloodGroup }),
      ...(heightCm && { heightCm: Number(heightCm) }),
      ...(weightKg && { weightKg: Number(weightKg) }),
      ...(allergies && { allergies: Array.isArray(allergies) ? allergies : allergies.split(',').map(s => s.trim()) }),
      ...(existingConditions && { existingConditions: Array.isArray(existingConditions) ? existingConditions : existingConditions.split(',').map(s => s.trim()) }),
      ...(currentMedications && { currentMedications: Array.isArray(currentMedications) ? currentMedications : currentMedications.split(',').map(s => s.trim()) }),
      ...(emergencyContact && { emergencyContact }),
      ...(address && { address }),
      ...(city && { city }),
      ...(dietaryPreference && { dietaryPreference }),
      ...(healthGoals && { healthGoals: Array.isArray(healthGoals) ? healthGoals : [healthGoals] })
    };

    if (profile) {
      profile = await dbAdapter.findByIdAndUpdate('PatientProfile', profile._id || profile.id, updatePayload);
    } else {
      profile = await dbAdapter.create('PatientProfile', {
        user: userId,
        ...updatePayload
      });
    }

    logAudit(req, 'PATIENT_PROFILE_UPDATED', 'PatientProfile', profile._id || profile.id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete patient account & personal medical data
// @route   DELETE /api/patients/account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    logAudit(req, 'ACCOUNT_DELETION_REQUESTED', 'User', userId, {}, 'SUCCESS');

    // Cascade delete ALL user-specific records and uploaded files
    const metrics = await purgeUserData(userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Your account and all associated medical records have been permanently erased.',
      details: metrics
    });
  } catch (error) {
    next(error);
  }
};
