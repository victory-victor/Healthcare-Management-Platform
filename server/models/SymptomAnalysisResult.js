const mongoose = require('mongoose');

const symptomAnalysisResultSchema = new mongoose.Schema(
  {
    record: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SymptomRecord',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    symptomSummary: {
      type: String,
      required: true
    },
    possibleExplanations: {
      type: [String],
      default: []
    },
    potentialConditions: [
      {
        condition: String,
        probability: String, // 'High', 'Moderate', 'Low'
        explanation: String
      }
    ],
    levelOfConcern: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Emergency'],
      default: 'Moderate'
    },
    warningSigns: {
      type: [String],
      default: []
    },
    suggestedSpecialty: {
      type: String,
      default: 'General Physician'
    },
    recommendedNextSteps: {
      type: [String],
      default: []
    },
    whenToConsultDoctor: {
      type: String,
      default: 'Schedule an appointment within 24-48 hours if symptoms do not improve.'
    },
    isEmergency: {
      type: Boolean,
      default: false
    },
    emergencyInstructions: {
      type: String,
      default: null
    },
    medicalDisclaimer: {
      type: String,
      default: 'This analysis provides AI-assisted healthcare information and educational guidance. It does not replace professional medical diagnosis or treatment. Always consult a qualified healthcare professional.'
    }
  },
  {
    timestamps: true
  }
);

symptomAnalysisResultSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SymptomAnalysisResult', symptomAnalysisResultSchema);
