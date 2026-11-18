const mongoose = require('mongoose');

const healthMetricSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recordedDate: {
      type: Date,
      default: Date.now
    },
    weightKg: {
      type: Number,
      required: true
    },
    systolicBp: {
      type: Number,
      default: 120
    },
    diastolicBp: {
      type: Number,
      default: 80
    },
    bloodGlucoseMgDl: {
      type: Number,
      default: 95
    },
    heartRateBpm: {
      type: Number,
      default: 72
    },
    oxygenSaturationPct: {
      type: Number,
      default: 98
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

healthMetricSchema.index({ user: 1, recordedDate: -1 });

module.exports = mongoose.model('HealthMetric', healthMetricSchema);
