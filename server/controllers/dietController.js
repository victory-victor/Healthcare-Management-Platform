const dbAdapter = require('../services/dbAdapter');
const { generate7DayDietPlan } = require('../ai/dietAI');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Generate personalized diet plan
// @route   POST /api/diet/generate
exports.generatePlan = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await dbAdapter.findOne('PatientProfile', { user: userId });

    // Explicitly parse and prioritize allergies passed by user or saved in profile
    let userAllergies = [];
    if (req.body.allergies) {
      if (Array.isArray(req.body.allergies)) {
        userAllergies = req.body.allergies.map(a => String(a).trim()).filter(Boolean);
      } else if (typeof req.body.allergies === 'string') {
        userAllergies = req.body.allergies.split(',').map(a => a.trim()).filter(Boolean);
      }
    } else if (profile?.allergies && Array.isArray(profile.allergies)) {
      userAllergies = profile.allergies;
    }

    const {
      age = profile?.dateOfBirth ? Math.floor((Date.now() - new Date(profile.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 30,
      height = profile?.heightCm || 170,
      weight = profile?.weightKg || 70,
      activityLevel = req.body.activityLevel || 'moderate',
      dietaryPreference = req.body.dietaryPreference || profile?.dietaryPreference || 'non-vegetarian',
      healthGoals = req.body.healthGoals || profile?.healthGoals || ['General healthy eating'],
      existingConditions = profile?.existingConditions || []
    } = req.body;

    const planData = await generate7DayDietPlan({
      age,
      height,
      weight,
      activityLevel,
      dietaryPreference,
      healthGoals,
      allergies: userAllergies,
      existingConditions
    });

    // Save active DietPlan
    const plan = await dbAdapter.create('DietPlan', {
      user: userId,
      title: planData.title,
      healthGoal: planData.healthGoal,
      dietaryPreference: planData.dietaryPreference,
      dailyCalorieTarget: planData.dailyCalorieTarget,
      macroTargets: planData.macroTargets,
      waterTargetMl: planData.waterTargetMl,
      groceryList: planData.groceryList,
      aiNutritionTips: planData.aiNutritionTips,
      isActive: true
    });

    // Save individual meals
    const mealsCreated = [];
    for (const day of planData.days) {
      for (const meal of day.meals) {
        const mealDoc = await dbAdapter.create('DietMeal', {
          dietPlan: plan._id || plan.id,
          dayNumber: day.dayNumber,
          ...meal
        });
        mealsCreated.push(mealDoc);
      }
    }

    logAudit(req, 'DIET_PLAN_GENERATED', 'DietPlan', plan._id || plan.id);

    res.status(201).json({
      success: true,
      message: 'Personalized 7-day nutrition plan generated successfully.',
      plan,
      meals: mealsCreated,
      days: planData.days
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active and historical diet plans
// @route   GET /api/diet
exports.getPlans = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const plans = await dbAdapter.find('DietPlan', { user: userId }, { createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get diet plan details with meals
// @route   GET /api/diet/:id
exports.getPlanById = async (req, res, next) => {
  try {
    const plan = await dbAdapter.findById('DietPlan', req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Diet plan not found.' });
    }

    const meals = await dbAdapter.find('DietMeal', { dietPlan: req.params.id });

    // Group meals by day number (1 to 7)
    const days = [];
    const daysNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (let i = 1; i <= 7; i++) {
      days.push({
        dayNumber: i,
        dayName: daysNames[i - 1],
        meals: meals.filter(m => m.dayNumber === i)
      });
    }

    res.status(200).json({
      success: true,
      plan,
      days
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log daily nutrition & water intake
// @route   POST /api/diet/nutrition-log
exports.logNutrition = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { waterIntakeMl = 250, caloriesConsumed = 0 } = req.body;

    const record = await dbAdapter.create('NutritionRecord', {
      user: userId,
      waterIntakeMl: Number(waterIntakeMl),
      caloriesConsumed: Number(caloriesConsumed),
      recordDate: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Nutrition and hydration record logged.',
      record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily nutrition logs
// @route   GET /api/diet/nutrition-logs
exports.getNutritionLogs = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const logs = await dbAdapter.find('NutritionRecord', { user: userId }, { createdAt: -1 }, 14);

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    next(error);
  }
};
