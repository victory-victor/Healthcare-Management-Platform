const mongoose = require('mongoose');

const extractedMedicalValueSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalReport',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    parameter: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    numericalValue: {
      type: Number,
      default: null
    },
    unit: {
      type: String,
      default: ''
    },
    referenceRange: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Normal', 'Above reference range', 'Below reference range', 'Unknown/unavailable'],
      default: 'Normal'
    },
    explanation: {
      type: String,
      default: ''
    },
    isFlaggedForDoctor: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

extractedMedicalValueSchema.index({ report: 1 });
extractedMedicalValueSchema.index({ user: 1 });

module.exports = mongoose.model('ExtractedMedicalValue', extractedMedicalValueSchema);
