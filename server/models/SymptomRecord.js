const mongoose = require('mongoose');

const symptomRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    symptoms: {
      type: [String],
      required: true
    },
    duration: {
      type: String,
      required: true,
      default: '1-3 days'
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate'
    },
    frequency: {
      type: String,
      default: 'Constant'
    },
    age: {
      type: Number,
      default: 30
    },
    medicalHistory: {
      type: String,
      default: ''
    },
    existingConditions: {
      type: [String],
      default: []
    },
    currentMedications: {
      type: [String],
      default: []
    },
    allergies: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

symptomRecordSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SymptomRecord', symptomRecordSchema);
