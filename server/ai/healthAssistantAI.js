/**
 * Module 8: AI Health Assistant Conversational Engine
 * MedAI Nexus Healthcare Platform
 * Powered by Google Gemini 2.5 Flash
 */

const { checkEmergency } = require('./symptomAI');
const { callGemini } = require('./geminiClient');

const generateAssistantResponse = async ({
  userMessage,
  conversationHistory = [],
  patientContext = null,
  contextAllowed = true
}) => {
  // Check for immediate emergency symptoms
  const emergencyCheck = checkEmergency(userMessage);
  if (emergencyCheck.isEmergency) {
    return {
      reply: `⚠️ **CRITICAL EMERGENCY WARNING**\n\nYour message references symptoms that may represent an immediate medical emergency: **"${emergencyCheck.matchedSymptom}"**.\n\n**Please take immediate action:**\n1. Call 911 (or your local emergency hotline) right away.\n2. Do not attempt to drive yourself to the hospital.\n3. Contact an emergency contact or family member immediately.\n\n*MedAI Nexus cannot replace emergency clinical care.*`,
      isEmergencyAlert: true,
      contextReferenced: false,
      suggestedSpecialty: 'Emergency Medicine'
    };
  }

  // Build authorized patient context summary
  let contextBrief = '';
  if (contextAllowed && patientContext) {
    const { profile, recentReports, activePrescriptions, recentSymptoms, activeDiet } = patientContext;
    contextBrief = `
Authorized Patient Medical Context:
- Name: ${profile?.user?.name || profile?.name || 'Patient'}
- Blood Group: ${profile?.bloodGroup || 'Unknown'}
- Known Allergies: ${profile?.allergies?.join(', ') || 'None recorded'}
- Existing Health Conditions: ${profile?.existingConditions?.join(', ') || 'None recorded'}
- Current Prescribed Medications: ${activePrescriptions?.map(p => p.medicineName).join(', ') || 'None active'}
- Recent Lab Findings: ${recentReports?.length ? `${recentReports[0].title} (${recentReports[0].overallHealthRisk})` : 'No recent reports'}
- Active Nutrition Plan: ${activeDiet ? activeDiet.healthGoal : 'Standard wellness'}
    `.trim();
  }

  // Invoke Google Gemini 2.5 Flash
  const systemInstruction = `You are the MedAI Nexus Intelligent Healthcare Assistant powered by Gemini 2.5 Flash.
Your mission is to provide clear, empathetic, evidence-based healthcare education and guidance.
RULES:
1. NEVER claim to be a licensed doctor.
2. NEVER provide a definitive clinical diagnosis.
3. NEVER prescribe medications or recommend modifying pharmaceutical dosages.
4. Frame all explanations as educational insights.
5. If the user asks about an uploaded lab report, prescription, or symptom, explain normal physiological mechanisms in simple, reassuring language.
6. Always recommend consulting a physician or specialist for diagnostic tests or prescription changes.
${contextBrief ? `\n${contextBrief}\n` : ''}`;

  const geminiRes = await callGemini({
    systemInstruction,
    prompt: userMessage,
    history: conversationHistory.slice(-8),
    temperature: 0.3
  });

  if (geminiRes.success && geminiRes.text) {
    return {
      reply: geminiRes.text,
      isEmergencyAlert: false,
      contextReferenced: Boolean(contextBrief),
      suggestedSpecialty: null
    };
  }

  // Clinical Dialogue Intelligence Engine (Autonomous, safe, context-aware)
  const lower = userMessage.toLowerCase();
  let reply = '';
  let suggestedSpecialty = null;

  if (lower.includes('allergy') || lower.includes('allergic')) {
    const allergiesList = patientContext?.profile?.allergies?.join(', ') || 'no specific allergies recorded';
    reply = `In your health profile, you currently have **${allergiesList}** listed. When dealing with allergic responses, mild symptoms like sneezing or minor pruritus (itching) often respond to antihistamines, but any swelling of the lips, tongue, or difficulty swallowing requires emergency medical evaluation immediately. Would you like to schedule a consultation with an allergist or dermatologist?`;
    suggestedSpecialty = 'Dermatologist';
  } else if (lower.includes('report') || lower.includes('lab') || lower.includes('blood test') || lower.includes('hemoglobin') || lower.includes('glucose')) {
    reply = `Looking at laboratory assessments in MedAI Nexus: Routine blood tests such as Complete Blood Counts (CBC), fasting blood glucose, and lipid panels provide quantitative snapshots of physiological balance.\n\n• **Normal ranges** represent values found in 95% of healthy individuals.\n• **Minor deviations** are frequently influenced by hydration, stress, recent meals, or timing.\n\nYou can upload your latest PDF or image report to the **Medical Report Analysis** module for automated OCR parameter extraction and trend comparison!`;
  } else if (lower.includes('prescription') || lower.includes('medicine') || lower.includes('dose') || lower.includes('pill')) {
    reply = `Regarding medications: Always take pharmaceutical agents strictly as prescribed by your licensed healthcare provider. Do not modify dosages, skip doses, or cease antibiotic courses early without direct clinical guidance.\n\nYou can use our **Prescription Scanner** to scan and convert your prescription into automated reminder notifications so you never miss a dose!`;
  } else if (lower.includes('diet') || lower.includes('food') || lower.includes('nutrition') || lower.includes('water')) {
    reply = `Nutrition plays a foundational role in metabolic regulation and cellular longevity. Maintaining steady hydration (2 to 2.5 liters daily) and consuming a balance of lean protein, high-fiber complex carbohydrates, and essential healthy fats supports sustained energy and insulin sensitivity.\n\nCheck out the **Diet Planner** module to generate a customized 7-day meal plan aligned with your specific health goals!`;
  } else if (lower.includes('appointment') || lower.includes('doctor') || lower.includes('consult')) {
    reply = `You can easily discover verified specialists and book online or in-person consultations through our **Find Doctors** and **Appointment Booking** modules. We have verified specialists across Cardiology, Neurology, Dermatology, Orthopedics, Pediatrics, and General Medicine ready to assist you.`;
    suggestedSpecialty = 'General Physician';
  } else {
    reply = `Thank you for reaching out to MedAI Nexus. I am your AI Health Assistant, designed to help you understand your wellness metrics, explain complex medical reports, review prescription schedules, and navigate your healthcare journey.\n\nHow can I support your health today? You can ask me about symptoms you are experiencing, dietary goals, or interpreting specific laboratory parameters.\n\n*Reminder: I provide healthcare guidance and education, not definitive medical diagnoses. Always consult your doctor for formal clinical evaluations.*`;
  }

  return {
    reply,
    isEmergencyAlert: false,
    contextReferenced: Boolean(contextBrief),
    suggestedSpecialty
  };
};

module.exports = {
  generateAssistantResponse
};
