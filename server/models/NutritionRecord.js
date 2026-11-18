const mongoose = require('mongoose');

const nutritionRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recordDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    waterIntakeMl: {
      type: Number,
      default: 1500
    },
    targetWaterMl: {
      type: Number,
      default: 2500
    },
    caloriesConsumed: {
      type: Number,
      default: 1850
    },
    mealsCompletedCount: {
      type: Number,
      default: 3
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

nutritionRecordSchema.index({ user: 1, recordDate: -1 });

module.exports = mongoose.model('NutritionRecord', nutritionRecordSchema);
