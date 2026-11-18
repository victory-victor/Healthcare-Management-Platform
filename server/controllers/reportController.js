const path = require('path');
const fs = require('fs');
const dbAdapter = require('../services/dbAdapter');
const { analyzeMedicalReport } = require('../ai/medicalReportAI');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Upload & analyze medical report
// @route   POST /api/reports/upload
exports.uploadReport = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const rawReportText = req.body.reportText ? req.body.reportText.trim() : '';

    if (!req.file && !rawReportText) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF or image medical report, or enter lab report text.'
      });
    }

    const originalname = req.file ? req.file.originalname : 'Lab_Report_Manual_Entry.txt';
    const filename = req.file ? req.file.filename : '';
    const filePath = req.file ? req.file.path : '';
    const size = req.file ? req.file.size : Buffer.byteLength(rawReportText, 'utf8');
    const mimetype = req.file ? req.file.mimetype : 'text/plain';
    const fileBuffer = (req.file && fs.existsSync(filePath)) ? fs.readFileSync(filePath) : null;

    // Create initial report record
    const report = await dbAdapter.create('MedicalReport', {
      user: userId,
      title: req.body.title || (req.file ? originalname.replace(/\.[^/.]+$/, "") : `Lab Report - ${new Date().toLocaleDateString()}`),
      originalFilename: originalname,
      storedFilename: filename,
      filePath: filePath,
      fileSize: size,
      mimeType: mimetype,
      status: 'processing'
    });

    const aiAnalysis = await analyzeMedicalReport({
      rawText: rawReportText,
      originalFilename: originalname,
      fileBuffer,
      mimeType: mimetype
    });

    // Update report with AI summary & status
    const updatedReport = await dbAdapter.findByIdAndUpdate('MedicalReport', report._id || report.id, {
      status: aiAnalysis.extractedValues.length > 0 ? 'analyzed' : 'no_biomarkers_found',
      ocrRawText: rawReportText,
      aiSummary: aiAnalysis.aiSummary,
      doctorQuestions: aiAnalysis.doctorQuestions,
      overallHealthRisk: aiAnalysis.overallHealthRisk
    });

    // Store each extracted value in ExtractedMedicalValue (only genuinely extracted parameters)
    const extractedDocs = [];
    for (const val of aiAnalysis.extractedValues) {
      const doc = await dbAdapter.create('ExtractedMedicalValue', {
        report: report._id || report.id,
        user: userId,
        ...val
      });
      extractedDocs.push(doc);
    }

    // Create patient notification
    await dbAdapter.create('Notification', {
      user: userId,
      title: aiAnalysis.extractedValues.length > 0 ? 'Medical Report Analyzed' : 'Report Analysis Notice',
      message: aiAnalysis.extractedValues.length > 0
        ? `Your report "${originalname}" has been parsed. ${extractedDocs.length} biomarker parameter(s) identified.`
        : `Your report "${originalname}" was processed, but no clinical biomarker parameters were identified.`,
      type: 'report',
      referenceId: report._id || report.id
    });

    logAudit(req, 'REPORT_UPLOADED_AND_ANALYZED', 'MedicalReport', report._id || report.id);

    res.status(201).json({
      success: true,
      message: aiAnalysis.extractedValues.length > 0
        ? 'Medical report uploaded and analyzed successfully.'
        : 'Medical report uploaded. No biomarker parameters could be identified from the input.',
      report: updatedReport,
      extractedValues: extractedDocs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all medical reports for user
// @route   GET /api/reports
exports.getReports = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const reports = await dbAdapter.find('MedicalReport', { user: userId }, { createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report by ID with extracted parameters
// @route   GET /api/reports/:id
exports.getReportById = async (req, res, next) => {
  try {
    const report = await dbAdapter.findById('MedicalReport', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Medical report not found.' });
    }

    if (String(report.user) !== String(req.user._id || req.user.id) && req.user.role === 'patient') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const values = await dbAdapter.find('ExtractedMedicalValue', { report: req.params.id });

    res.status(200).json({
      success: true,
      report,
      extractedValues: values
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-analyze report
// @route   POST /api/reports/:id/analyze
exports.reanalyzeReport = async (req, res, next) => {
  try {
    const report = await dbAdapter.findById('MedicalReport', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const aiAnalysis = await analyzeMedicalReport({
      rawText: report.ocrRawText || report.title,
      originalFilename: report.originalFilename
    });

    const updated = await dbAdapter.findByIdAndUpdate('MedicalReport', req.params.id, {
      aiSummary: aiAnalysis.aiSummary,
      overallHealthRisk: aiAnalysis.overallHealthRisk
    });

    res.status(200).json({
      success: true,
      message: 'Report re-analyzed successfully.',
      report: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete medical report
// @route   DELETE /api/reports/:id
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await dbAdapter.findById('MedicalReport', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (String(report.user) !== String(req.user._id || req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await dbAdapter.findByIdAndDelete('MedicalReport', req.params.id);
    // Delete physical file if exists
    if (report.filePath && fs.existsSync(report.filePath)) {
      try { fs.unlinkSync(report.filePath); } catch(e) {}
    }

    logAudit(req, 'REPORT_DELETED', 'MedicalReport', req.params.id);
    res.status(200).json({ success: true, message: 'Medical report deleted.' });
  } catch (error) {
    next(error);
  }
};
