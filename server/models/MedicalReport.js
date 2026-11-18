const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      default: 'Comprehensive Health Lab Report'
    },
    originalFilename: {
      type: String,
      required: true
    },
    storedFilename: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    reportDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'analyzed', 'failed'],
      default: 'uploaded'
    },
    ocrRawText: {
      type: String,
      default: ''
    },
    aiSummary: {
      type: String,
      default: ''
    },
    doctorQuestions: {
      type: [String],
      default: []
    },
    overallHealthRisk: {
      type: String,
      enum: ['Normal', 'Attention Needed', 'Critical Attention'],
      default: 'Normal'
    }
  },
  {
    timestamps: true
  }
);

medicalReportSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
