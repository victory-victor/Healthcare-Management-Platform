const mongoose = require('mongoose');

const consentRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    consentType: {
      type: String,
      enum: ['medical_data_processing', 'ai_analysis', 'notifications', 'telehealth_terms', 'anonymized_research'],
      required: true
    },
    isGranted: {
      type: Boolean,
      required: true,
      default: true
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    revokedAt: {
      type: Date,
      default: null
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    version: {
      type: String,
      default: 'v1.0'
    }
  },
  {
    timestamps: true
  }
);

consentRecordSchema.index({ user: 1, consentType: 1 });

module.exports = mongoose.model('ConsentRecord', consentRecordSchema);
