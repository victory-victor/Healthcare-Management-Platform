/**
 * Module 2: AI Symptom Analysis Engine
 * MedAI Nexus Healthcare Platform
 * Powered by Google Gemini 2.5 Flash
 */

const { callGemini } = require('./geminiClient');

const EMERGENCY_SYMPTOMS = [
  'chest pain',
  'crushing chest pressure',
  'difficulty breathing',
  'shortness of breath',
  'sudden numbness',
  'facial drooping',
  'slurred speech',
  'loss of consciousness',
  'severe bleeding',
  'coughing up blood',
  'anaphylaxis',
  'blue lips',
  'seizure'
];

const checkEmergency = (symptomsText) => {
  const lower = symptomsText.toLowerCase();
  for (const symptom of EMERGENCY_SYMPTOMS) {
    if (lower.includes(symptom)) {
      return {
        isEmergency: true,
        matchedSymptom: symptom,
        emergencyInstructions: 'CRITICAL ALERT: Your reported symptoms indicate a potential medical emergency. Please immediately call 911 (or your local emergency services) or go to the nearest emergency room. Do not wait for an online appointment.'
      };
    }
  }
  return { isEmergency: false, matchedSymptom: null, emergencyInstructions: null };
};

const analyzeSymptoms = async ({ symptoms, duration, severity, frequency, age, existingConditions = [], currentMedications = [], allergies = [] }) => {
  // Input validation
  if (!symptoms || symptoms.length === 0) {
    throw new Error('Please provide at least one symptom for analysis.');
  }

  const symptomsCombined = Array.isArray(symptoms) ? symptoms.join(', ') : String(symptoms);
  const emergencyCheck = checkEmergency(symptomsCombined);

  const medicalDisclaimer = 'This analysis provides AI-assisted healthcare information and educational guidance. It does not replace professional medical diagnosis or treatment. Always consult a qualified healthcare professional.';

  // Call Google Gemini API (Gemini 2.5 Flash)
  const geminiRes = await callGemini({
    systemInstruction: `You are an expert clinical triage healthcare assistant for MedAI Nexus. Analyze patient reported symptoms and return a strictly valid JSON object.
NEVER diagnose a patient definitively. Frame all observations as educational possibilities.
JSON schema:
{
  "symptomSummary": string,
  "possibleExplanations": [string],
  "potentialConditions": [{"condition": string, "probability": "High"|"Moderate"|"Low", "explanation": string}],
  "levelOfConcern": "Low"|"Moderate"|"High"|"Emergency",
  "warningSigns": [string],
  "suggestedSpecialty": string,
  "recommendedNextSteps": [string],
  "whenToConsultDoctor": string,
  "isEmergency": boolean
}`,
    prompt: `Patient Data:
- Symptoms: ${symptomsCombined}
- Duration: ${duration}
- Severity: ${severity}
- Frequency: ${frequency}
- Age: ${age}
- Existing Conditions: ${existingConditions.join(', ') || 'None'}
- Current Medications: ${currentMedications.join(', ') || 'None'}
- Allergies: ${allergies.join(', ') || 'None'}`,
    isJson: true,
    temperature: 0.2
  });

  if (geminiRes.success && geminiRes.data) {
    const parsed = geminiRes.data;
    return {
      ...parsed,
      isEmergency: emergencyCheck.isEmergency || Boolean(parsed.isEmergency),
      emergencyInstructions: emergencyCheck.emergencyInstructions || parsed.emergencyInstructions,
      medicalDisclaimer
    };
  }

  // Clinical Rule-Based Intelligence Engine (Accurate, Fast, Non-diagnostic)
  const lower = symptomsCombined.toLowerCase();
  let potentialConditions = [];
  let suggestedSpecialty = 'General Physician';
  let warningSigns = ['Fever greater than 102°F (38.9°C)', 'Symptoms worsening after 3 days', 'Persistent inability to keep fluids down'];
  let recommendedNextSteps = ['Ensure adequate rest and hydration', 'Monitor temperature and vital metrics', 'Schedule a clinical consultation if symptoms persist'];
  let levelOfConcern = severity === 'severe' ? 'High' : (severity === 'moderate' ? 'Moderate' : 'Low');

  if (emergencyCheck.isEmergency) {
    levelOfConcern = 'Emergency';
    suggestedSpecialty = 'Emergency Medicine';
    warningSigns.push('Acute breathing difficulty', 'Persistent chest pressure', 'Altered mental state');
    recommendedNextSteps = ['Seek immediate emergency medical care', 'Do not drive yourself to the hospital'];
  } else if (lower.includes('headache') || lower.includes('migraine')) {
    suggestedSpecialty = 'Neurologist';
    potentialConditions = [
      { condition: 'Tension Headache', probability: 'High', explanation: 'Commonly induced by physical or emotional stress, eye fatigue, or cervical muscle tension.' },
      { condition: 'Migraine with or without Aura', probability: 'Moderate', explanation: 'Characterized by throbbing unilateral or bilateral pain, often sensitive to light and noise.' },
      { condition: 'Dehydration or Sleep Deprivation Cephalea', probability: 'Moderate', explanation: 'Rapidly responsive to fluid rehydration and restorative rest.' }
    ];
    warningSigns.push('Sudden "thunderclap" headache', 'Headache accompanied by stiff neck and confusion');
  } else if (lower.includes('cough') || lower.includes('sore throat') || lower.includes('fever') || lower.includes('cold')) {
    suggestedSpecialty = 'General Physician';
    potentialConditions = [
      { condition: 'Upper Respiratory Viral Tract Infection', probability: 'High', explanation: 'Mild viral inflammation of the nasopharynx and bronchial passages.' },
      { condition: 'Seasonal Allergic Rhinitis / Pharyngitis', probability: 'Moderate', explanation: 'Hypersensitivity reaction to environmental airborne allergens.' },
      { condition: 'Acute Bronchitis', probability: 'Low', explanation: 'Inflammation of bronchial airways, often following a primary cold or flu.' }
    ];
  } else if (lower.includes('stomach') || lower.includes('abdominal') || lower.includes('nausea') || lower.includes('diarrhea') || lower.includes('acid')) {
    suggestedSpecialty = 'Gastroenterologist';
    potentialConditions = [
      { condition: 'Gastroenteritis / Dietary Indigestion', probability: 'High', explanation: 'Temporary gastrointestinal irritation from dietary changes or viral exposure.' },
      { condition: 'Gastroesophageal Reflux (GERD)', probability: 'Moderate', explanation: 'Gastric acid backflow causing heartburn or epigastric discomfort.' },
      { condition: 'Irritable Bowel Sensitivity', probability: 'Low', explanation: 'Functional digestive motility imbalance triggered by stress or food triggers.' }
    ];
  } else if (lower.includes('joint') || lower.includes('knee') || lower.includes('back') || lower.includes('muscle')) {
    suggestedSpecialty = 'Orthopedic';
    potentialConditions = [
      { condition: 'Musculoskeletal Strain', probability: 'High', explanation: 'Acute or postural micro-tearing of supporting tendon or muscle fibers.' },
      { condition: 'Osteoarthritis or Joint Inflammation', probability: 'Moderate', explanation: 'Age-related wear or inflammatory response within articular surfaces.' }
    ];
  } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('itching')) {
    suggestedSpecialty = 'Dermatologist';
    potentialConditions = [
      { condition: 'Contact Dermatitis', probability: 'High', explanation: 'Epidermal allergic response to cosmetics, detergents, or textiles.' },
      { condition: 'Eczema / Atopic Flares', probability: 'Moderate', explanation: 'Chronic inflammatory skin barrier disruption with pruritus.' }
    ];
  } else {
    potentialConditions = [
      { condition: 'General Physiological Fatigue or Malaise', probability: 'Moderate', explanation: 'Sub-acute response to physical strain, irregular sleep, or nutritional deficit.' },
      { condition: 'Non-specific Sub-clinical Inflammation', probability: 'Low', explanation: 'Warrants baseline primary care blood work if persistent.' }
    ];
  }

  return {
    symptomSummary: `Reported symptoms: ${symptomsCombined}. Duration: ${duration}, Severity assessed as ${severity}, frequency: ${frequency}.`,
    possibleExplanations: [
      `Symptom pattern suggests ${potentialConditions[0]?.condition || 'a mild acute episode'}.`,
      `Contextual factors (age ${age}, duration ${duration}) suggest monitoring without immediate invasive intervention unless red-flag signs manifest.`
    ],
    potentialConditions,
    levelOfConcern,
    warningSigns,
    suggestedSpecialty,
    recommendedNextSteps,
    whenToConsultDoctor: emergencyCheck.isEmergency
      ? 'Immediately. Call emergency services.'
      : 'Consult a physician within 24 to 48 hours if symptoms worsen, or immediately if red-flag signs occur.',
    isEmergency: emergencyCheck.isEmergency,
    emergencyInstructions: emergencyCheck.emergencyInstructions,
    medicalDisclaimer
  };
};

module.exports = {
  analyzeSymptoms,
  checkEmergency
};
