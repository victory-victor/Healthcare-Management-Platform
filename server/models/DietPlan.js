const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      default: 'Personalized 7-Day Precision Health Nutrition Plan'
    },
    healthGoal: {
      type: String,
      required: true,
      default: 'General healthy eating'
    },
    dietaryPreference: {
      type: String,
      required: true,
      default: 'non-vegetarian'
    },
    dailyCalorieTarget: {
      type: Number,
      required: true,
      default: 2000
    },
    macroTargets: {
      proteinGrams: { type: Number, default: 130 },
      carbsGrams: { type: Number, default: 220 },
      fatsGrams: { type: Number, default: 60 }
    },
    waterTargetMl: {
      type: Number,
      default: 2500
    },
    groceryList: {
      type: [String],
      default: []
    },
    aiNutritionTips: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

dietPlanSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('DietPlan', dietPlanSchema);
