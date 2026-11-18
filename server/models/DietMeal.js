const mongoose = require('mongoose');

const dietMealSchema = new mongoose.Schema(
  {
    dietPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DietPlan',
      required: true
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 7
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'morning_snack', 'lunch', 'evening_snack', 'dinner'],
      required: true
    },
    foodItems: {
      type: [String],
      required: true
    },
    portionSizes: {
      type: String,
      default: 'Standard balanced serving'
    },
    estimatedCalories: {
      type: Number,
      required: true
    },
    proteinGrams: {
      type: Number,
      default: 20
    },
    carbsGrams: {
      type: Number,
      default: 45
    },
    fatsGrams: {
      type: Number,
      default: 12
    },
    nutritionExplanation: {
      type: String,
      default: 'Nutrient-rich option supporting stable energy and cellular repair.'
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

dietMealSchema.index({ dietPlan: 1, dayNumber: 1 });

module.exports = mongoose.model('DietMeal', dietMealSchema);
