const fs = require('fs');
const dbAdapter = require('../services/dbAdapter');
const { analyzePrescription } = require('../ai/prescriptionAI');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Upload & scan prescription
// @route   POST /api/prescriptions/upload
exports.uploadPrescription = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (!req.file && (!req.body.rawText || !req.body.rawText.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please select a prescription file (image/PDF) or enter prescription text.'
      });
    }

    const originalFilename = req.file ? req.file.originalname : 'Prescription_Text_Entry.txt';
    const filePath = req.file ? req.file.path : '';
    const filename = req.file ? req.file.filename : '';
    const mimeType = req.file ? req.file.mimetype : 'text/plain';
    const fileBuffer = (req.file && fs.existsSync(filePath)) ? fs.readFileSync(filePath) : null;

    const rawUserText = req.body.rawText ? req.body.rawText.trim() : '';

    const aiResult = await analyzePrescription({
      rawText: rawUserText,
      originalFilename,
      fileBuffer,
      mimeType
    });

    const prescription = await dbAdapter.create('Prescription', {
      user: userId,
      title: req.body.title || (req.file ? originalFilename.replace(/\.[^/.]+$/, "") : `Prescription - ${new Date().toLocaleDateString()}`),
      originalFilename,
      storedFilename: filename,
      filePath,
      ocrRawText: rawUserText,
      prescribingDoctor: aiResult.prescribingDoctor,
      prescriptionDate: aiResult.prescriptionDate,
      status: aiResult.medicines.length > 0 ? 'analyzed' : 'no_medications_found',
      notes: aiResult.notes
    });

    const medicinesCreated = [];
    for (const med of aiResult.medicines) {
      const doc = await dbAdapter.create('PrescriptionMedicine', {
        prescription: prescription._id || prescription.id,
        user: userId,
        ...med
      });
      medicinesCreated.push(doc);

      // Create automatic daily reminder schedule
      await dbAdapter.create('MedicationReminder', {
        medicine: doc._id || doc.id,
        user: userId,
        medicineName: doc.medicineName,
        dosage: doc.dosage,
        timeOfDay: '09:00 AM',
        isActive: true,
        statusToday: 'pending'
      });
    }

    await dbAdapter.create('Notification', {
      user: userId,
      title: medicinesCreated.length > 0 ? 'Prescription Processed' : 'Prescription Inconclusive',
      message: medicinesCreated.length > 0
        ? `Prescription parsed: ${medicinesCreated.length} medications added to your schedule.`
        : 'Prescription scanned, but no legible medications were identified.',
      type: 'medication',
      referenceId: prescription._id || prescription.id
    });

    logAudit(req, 'PRESCRIPTION_SCANNED', 'Prescription', prescription._id || prescription.id);

    res.status(201).json({
      success: true,
      message: 'Prescription scanned and medicines scheduled.',
      prescription,
      medicines: medicinesCreated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all prescriptions for user
// @route   GET /api/prescriptions
exports.getPrescriptions = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const prescriptions = await dbAdapter.find('Prescription', { user: userId }, { createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescription by ID with medicines list
// @route   GET /api/prescriptions/:id
exports.getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await dbAdapter.findById('Prescription', req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    if (String(prescription.user) !== String(req.user._id || req.user.id) && req.user.role === 'patient') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const medicines = await dbAdapter.find('PrescriptionMedicine', { prescription: req.params.id });

    res.status(200).json({
      success: true,
      prescription,
      medicines
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get medication reminders
// @route   GET /api/prescriptions/reminders
exports.getReminders = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const reminders = await dbAdapter.find('MedicationReminder', { user: userId });

    res.status(200).json({
      success: true,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark medication as taken or skipped
// @route   PUT /api/prescriptions/reminders/:id/status
exports.updateReminderStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'taken' | 'skipped' | 'pending'
    const reminder = await dbAdapter.findById('MedicationReminder', req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found.' });
    }

    const updated = await dbAdapter.findByIdAndUpdate('MedicationReminder', req.params.id, {
      statusToday: status,
      lastTakenAt: status === 'taken' ? new Date() : reminder.lastTakenAt
    });

    res.status(200).json({
      success: true,
      message: `Medication status updated to ${status}.`,
      reminder: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
exports.deletePrescription = async (req, res, next) => {
  try {
    const prescription = await dbAdapter.findById('Prescription', req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    await dbAdapter.findByIdAndDelete('Prescription', req.params.id);
    logAudit(req, 'PRESCRIPTION_DELETED', 'Prescription', req.params.id);

    res.status(200).json({ success: true, message: 'Prescription deleted.' });
  } catch (error) {
    next(error);
  }
};
