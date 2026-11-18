const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      default: 'Doctor Prescription'
    },
    originalFilename: {
      type: String,
      default: 'Digital_Prescription.pdf'
    },
    storedFilename: {
      type: String,
      default: 'digital_rx'
    },
    filePath: {
      type: String,
      default: 'digital://in-app-rx'
    },
    ocrRawText: {
      type: String,
      default: ''
    },
    prescribingDoctor: {
      type: String,
      default: 'Doctor'
    },
    prescriptionDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'analyzed', 'verified', 'active', 'completed', 'failed', 'no_medications_found'],
      default: 'verified'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

prescriptionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
