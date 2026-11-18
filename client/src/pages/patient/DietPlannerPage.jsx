import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  Utensils,
  Droplets,
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  Calendar,
  Flame,
  Dumbbell,
  Clock,
  Plus
} from 'lucide-react';

export default function DietPlannerPage() {
  const toast = useToast();

  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [activeDays, setActiveDays] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [waterLogged, setWaterLogged] = useState(1500);

  // Form states
  const [goal, setGoal] = useState('General healthy eating');
  const [preference, setPreference] = useState('non-vegetarian');
  const [activity, setActivity] = useState('moderate');
  const [allergiesInput, setAllergiesInput] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diet');
      if (res.data?.success && res.data.plans?.length > 0) {
        setPlans(res.data.plans);
        loadPlanDetails(res.data.plans[0]._id || res.data.plans[0].id);
      }
    } catch (e) {
      toast.error('Failed to load diet plans.');
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDetails = async (id) => {
    try {
      const res = await api.get(`/diet/${id}`);
      if (res.data?.success) {
        setActivePlan(res.data.plan);
        setActiveDays(res.data.days || []);
      }
    } catch (e) {
      toast.error('Failed to load plan details.');
    }
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/diet/generate', {
        healthGoals: [goal],
        dietaryPreference: preference,
        activityLevel: activity,
        allergies: allergiesInput ? allergiesInput.split(',').map(s => s.trim()) : []
      });

      if (res.data?.success) {
        toast.success('New 7-Day Precision Diet Plan generated!');
        setActivePlan(res.data.plan);
        setActiveDays(res.data.days || []);
        fetchPlans();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Plan generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleLogWater = async (amount) => {
    const updated = waterLogged + amount;
    setWaterLogged(updated);
    try {
      await api.post('/diet/nutrition-log', {
        waterIntakeMl: updated,
        caloriesConsumed: activePlan?.dailyCalorieTarget || 2000
      });
      toast.success(`Logged +${amount}ml water! Current total: ${updated}ml.`);
    } catch (e) {}
  };

  const currentDay = activeDays[selectedDayIndex] || activeDays[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-6 h-6 text-indigo-600" /> AI Precision Diet Planner & Macro Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalized 7-day culinary nutritional scheduling aligned with metabolic health, allergies, and physical targets.
          </p>
        </div>
      </div>

      {/* Plan Generation Form */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" /> Generate New Personalized 7-Day Plan
        </h2>

        <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Health Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
            >
              <option value="General healthy eating">General healthy eating</option>
              <option value="Weight management">Weight management (Deficit)</option>
              <option value="Muscle development">Muscle development (Surplus)</option>
              <option value="Cardiovascular wellness">Cardiovascular wellness</option>
              <option value="Glycemic control">Glycemic control</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Preference</label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
            >
              <option value="non-vegetarian">Non-Vegetarian</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="eggetarian">Eggetarian</option>
              <option value="jain">Jain (No Root Veggies)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Level</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
            >
              <option value="sedentary">Sedentary (Desk Job)</option>
              <option value="moderate">Moderate (3-4 workouts/wk)</option>
              <option value="active">Active (Daily training)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Known Food Allergies</label>
            <input
              type="text"
              value={allergiesInput}
              onChange={(e) => setAllergiesInput(e.target.value)}
              placeholder="e.g. Peanuts, Dairy, Shellfish"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-2">
            <button
              type="submit"
              disabled={generating}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Formulating Precision Nutrition Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate 7-Day Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Hydration Tracker Ribbon */}
      <div className="p-5 bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-sm">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-sky-950">Daily Hydration Tracker</div>
            <div className="text-xs text-sky-700">
              Logged: <strong>{waterLogged} ml</strong> / Target: {activePlan?.waterTargetMl || 2500} ml
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLogWater(250)}
            className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> +250ml Glass
          </button>
          <button
            onClick={() => handleLogWater(500)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> +500ml Bottle
          </button>
        </div>
      </div>

      {/* Active Plan Dashboard */}
      {activePlan && (
        <div className="space-y-6">
          {/* Target Macro Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Daily Target</span>
              <span className="text-2xl font-black text-slate-900">{activePlan.dailyCalorieTarget}</span>
              <span className="text-[10px] text-slate-400 block">kcal</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">Protein</span>
              <span className="text-2xl font-black text-rose-600">{activePlan.macroTargets?.proteinGrams || 130}g</span>
              <span className="text-[10px] text-slate-400 block">Tissue Repair</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">Carbohydrates</span>
              <span className="text-2xl font-black text-amber-600">{activePlan.macroTargets?.carbsGrams || 220}g</span>
              <span className="text-[10px] text-slate-400 block">Complex Fuel</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-500 block">Healthy Fats</span>
              <span className="text-2xl font-black text-teal-600">{activePlan.macroTargets?.fatsGrams || 60}g</span>
              <span className="text-[10px] text-slate-400 block">Cellular Health</span>
            </div>
          </div>

          {/* 7-Day Day Selector Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {activeDays.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedDayIndex === idx
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Day {day.dayNumber}: {day.dayName}
              </button>
            ))}
          </div>

          {/* Day's Meals Schedule */}
          {currentDay && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Meals Schedule for {currentDay.dayName}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentDay.meals.map((meal, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {meal.mealType.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500" /> {meal.estimatedCalories} kcal
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-800">Ingredients & Items:</div>
                        <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                          {meal.foodItems.map((item, itemIdx) => (
                            <li key={itemIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-600">
                        <span>P: {meal.proteinGrams}g</span>
                        <span>C: {meal.carbsGrams}g</span>
                        <span>F: {meal.fatsGrams}g</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">{meal.nutritionExplanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grocery List Card */}
          {activePlan.groceryList?.length > 0 && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" /> Weekly Grocery Provisioning Checklist
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-700">
                {activePlan.groceryList.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
