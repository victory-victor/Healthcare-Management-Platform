const dbAdapter = require('../services/dbAdapter');
const { analyzeSymptoms } = require('../ai/symptomAI');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Analyze user symptoms using AI
// @route   POST /api/symptoms/analyze
exports.analyze = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      symptoms,
      duration = '1-3 days',
      severity = 'moderate',
      frequency = 'Constant',
      age = 30
    } = req.body;

    if (!symptoms || (Array.isArray(symptoms) && symptoms.length === 0)) {
      return res.status(400).json({ success: false, message: 'Please provide at least one symptom.' });
    }

    // Retrieve authorized medical context if available
    const profile = await dbAdapter.findOne('PatientProfile', { user: userId });

    const existingConditions = profile?.existingConditions || [];
    const currentMedications = profile?.currentMedications || [];
    const allergies = profile?.allergies || [];

    // Save symptom record
    const record = await dbAdapter.create('SymptomRecord', {
      user: userId,
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
      duration,
      severity,
      frequency,
      age: Number(age) || 30,
      existingConditions,
      currentMedications,
      allergies
    });

    // Run AI Analysis Engine
    const aiResult = await analyzeSymptoms({
      symptoms,
      duration,
      severity,
      frequency,
      age,
      existingConditions,
      currentMedications,
      allergies
    });

    // Save analysis result
    const savedResult = await dbAdapter.create('SymptomAnalysisResult', {
      record: record._id || record.id,
      user: userId,
      ...aiResult
    });

    logAudit(req, 'SYMPTOMS_ANALYZED', 'SymptomAnalysisResult', savedResult._id || savedResult.id, {
      isEmergency: aiResult.isEmergency,
      levelOfConcern: aiResult.levelOfConcern
    });

    res.status(200).json({
      success: true,
      result: savedResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user symptom analysis history
// @route   GET /api/symptoms/history
exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const history = await dbAdapter.find('SymptomAnalysisResult', { user: userId }, { createdAt: -1 }, 50);

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single symptom analysis by ID
// @route   GET /api/symptoms/:id
exports.getById = async (req, res, next) => {
  try {
    const result = await dbAdapter.findById('SymptomAnalysisResult', req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Symptom analysis record not found.' });
    }

    // Verify ownership or doctor/admin access
    if (String(result.user) !== String(req.user._id || req.user.id) && req.user.role === 'patient') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete symptom analysis by ID
// @route   DELETE /api/symptoms/:id
exports.deleteById = async (req, res, next) => {
  try {
    const result = await dbAdapter.findById('SymptomAnalysisResult', req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    if (String(result.user) !== String(req.user._id || req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await dbAdapter.findByIdAndDelete('SymptomAnalysisResult', req.params.id);
    res.status(200).json({ success: true, message: 'Symptom record removed successfully.' });
  } catch (error) {
    next(error);
  }
};
