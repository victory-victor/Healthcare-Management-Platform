/**
 * Module 3: AI Medical Report Analysis Engine
 * MedAI Nexus Healthcare Platform
 * Powered by Google Gemini 2.5 Flash
 */

const { callGemini } = require('./geminiClient');

const STANDARD_REFERENCE_RANGES = {
  hemoglobin: { min: 13.5, max: 17.5, unit: 'g/dL', name: 'Hemoglobin', aliases: ['hemoglobin', 'hgb', 'hb'], explanation: 'Protein in red blood cells that carries oxygen throughout your body.' },
  rbc: { min: 4.5, max: 5.9, unit: 'million/mcL', name: 'RBC (Red Blood Cells)', aliases: ['rbc', 'red blood cells'], explanation: 'Cells responsible for transporting oxygen from lungs to body tissues.' },
  wbc: { min: 4500, max: 11000, unit: 'cells/mcL', name: 'WBC (White Blood Cells)', aliases: ['wbc', 'white blood cells', 'leukocytes'], explanation: 'Immune cells that fight infection and systemic inflammation.' },
  platelets: { min: 150000, max: 450000, unit: 'cells/mcL', name: 'Platelets', aliases: ['platelets', 'plt', 'thrombocytes'], explanation: 'Blood cells essential for normal blood clotting and wound healing.' },
  fasting_glucose: { min: 70, max: 99, unit: 'mg/dL', name: 'Fasting Blood Glucose', aliases: ['fasting blood glucose', 'glucose', 'blood sugar', 'fbs'], explanation: 'Measures blood sugar level after an overnight fast; key for diabetes evaluation.' },
  hba1c: { min: 4.0, max: 5.6, unit: '%', name: 'HbA1c (Glycated Hemoglobin)', aliases: ['hba1c', 'glycated hemoglobin', 'a1c'], explanation: 'Reflects average blood sugar control over the preceding 2 to 3 months.' },
  cholesterol: { min: 125, max: 200, unit: 'mg/dL', name: 'Total Cholesterol', aliases: ['total cholesterol', 'cholesterol'], explanation: 'Overall amount of cholesterol in your bloodstream.' },
  hdl: { min: 40, max: 60, unit: 'mg/dL', name: 'HDL Cholesterol ("Good")', aliases: ['hdl', 'hdl cholesterol'], explanation: 'High-density lipoprotein that helps remove other forms of cholesterol from arteries.' },
  ldl: { min: 0, max: 100, unit: 'mg/dL', name: 'LDL Cholesterol ("Bad")', aliases: ['ldl', 'ldl cholesterol'], explanation: 'Low-density lipoprotein; elevated levels can form arterial plaque.' },
  triglycerides: { min: 0, max: 150, unit: 'mg/dL', name: 'Triglycerides', aliases: ['triglycerides', 'trig'], explanation: 'Type of fat found in blood derived from excess calories.' },
  creatinine: { min: 0.7, max: 1.3, unit: 'mg/dL', name: 'Serum Creatinine', aliases: ['serum creatinine', 'creatinine', 'creat'], explanation: 'Waste product filtered by kidneys; key indicator of renal filtration health.' },
  urea: { min: 7, max: 20, unit: 'mg/dL', name: 'Blood Urea Nitrogen (BUN)', aliases: ['blood urea nitrogen', 'bun', 'urea'], explanation: 'Measures nitrogen in blood from urea waste, reflecting kidney and liver metabolism.' },
  alt: { min: 7, max: 56, unit: 'U/L', name: 'ALT / SGPT (Liver Enzyme)', aliases: ['alt', 'sgpt'], explanation: 'Enzyme found mostly in the liver; elevated levels may indicate liver stress.' },
  ast: { min: 10, max: 40, unit: 'U/L', name: 'AST / SGOT (Liver Enzyme)', aliases: ['ast', 'sgot'], explanation: 'Enzyme found in liver, heart, and muscle tissue.' },
  tsh: { min: 0.4, max: 4.0, unit: 'mIU/L', name: 'TSH (Thyroid Stimulating Hormone)', aliases: ['tsh', 'thyroid stimulating hormone'], explanation: 'Pituitary hormone regulating thyroid gland hormone production.' },
  vitamin_d: { min: 30, max: 100, unit: 'ng/mL', name: 'Vitamin D (25-Hydroxy)', aliases: ['vitamin d', '25-hydroxy vitamin d', 'vit d'], explanation: 'Crucial for bone density, calcium absorption, and immune function.' },
  vitamin_b12: { min: 200, max: 900, unit: 'pg/mL', name: 'Vitamin B12', aliases: ['vitamin b12', 'vit b12', 'cobalamin'], explanation: 'Essential for nerve tissue health, brain function, and red blood cell production.' }
};

const extractValuesFromText = (rawText = '') => {
  const extracted = [];
  if (!rawText || !rawText.trim()) return extracted;

  const lower = rawText.toLowerCase();

  for (const [key, ref] of Object.entries(STANDARD_REFERENCE_RANGES)) {
    // Search using aliases
    const aliasesPattern = (ref.aliases || [key]).map(a => a.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    const regex = new RegExp(`(?:${aliasesPattern})[\\s:=-]+([0-9]+(?:\\.[0-9]+)?)`, 'i');
    const match = lower.match(regex);

    if (match) {
      const numVal = parseFloat(match[1]);
      let status = 'Normal';
      if (numVal < ref.min) status = 'Below reference range';
      else if (numVal > ref.max) status = 'Above reference range';

      extracted.push({
        parameter: ref.name,
        value: `${numVal}`,
        numericalValue: numVal,
        unit: ref.unit,
        referenceRange: `${ref.min} - ${ref.max} ${ref.unit}`,
        status,
        explanation: ref.explanation,
        isFlaggedForDoctor: status !== 'Normal'
      });
    }
  }

  // NOTE: Zero dummy or fabricated parameters are returned if none matched.
  return extracted;
};

const analyzeMedicalReport = async ({ rawText = '', originalFilename = 'Lab_Report', fileBuffer = null, mimeType = 'text/plain' }) => {
  let extractedValues = [];
  let aiSummary = '';
  let doctorQuestions = [];
  let overallHealthRisk = 'Normal';

  // 1. Try Gemini 2.5 Flash Multimodal or Structured Parsing
  try {
    const fileData = (fileBuffer && mimeType) ? {
      base64: fileBuffer.toString('base64'),
      mimeType
    } : null;

    const geminiRes = await callGemini({
      systemInstruction: 'You are a certified diagnostic clinical laboratory document interpreter for MedAI Nexus. Extract genuine clinical biomarker test parameters. STRICT SAFETY RULE: NEVER hallucinate, fabricate, or guess test values that are not present. If the document has no laboratory parameters or is unreadable, return an empty array for "extractedValues".',
      prompt: `Laboratory Document: "${originalFilename}"
Text input (if provided):
${rawText || 'None'}

Extract all laboratory biomarker test parameters from this document or text.
Return ONLY valid JSON with this exact structure:
{
  "extractedValues": [
    {
      "parameter": string,
      "value": string,
      "numericalValue": number,
      "unit": string,
      "referenceRange": string,
      "status": "Normal" | "Above reference range" | "Below reference range",
      "explanation": string,
      "isFlaggedForDoctor": boolean
    }
  ],
  "aiSummary": string,
  "doctorQuestions": [string],
  "overallHealthRisk": "Normal" | "Attention Needed" | "Critical Attention" | "No Biomarkers Detected"
}`,
      fileData,
      isJson: true,
      temperature: 0.1
    });

    if (geminiRes.success && geminiRes.data && Array.isArray(geminiRes.data.extractedValues)) {
      extractedValues = geminiRes.data.extractedValues.map(v => ({
        parameter: v.parameter || 'Unknown Parameter',
        value: String(v.value || v.numericalValue || ''),
        numericalValue: Number(v.numericalValue) || (parseFloat(v.value) || 0),
        unit: v.unit || '',
        referenceRange: v.referenceRange || 'Standard clinical range',
        status: v.status || 'Normal',
        explanation: v.explanation || 'Diagnostic laboratory biomarker.',
        isFlaggedForDoctor: Boolean(v.isFlaggedForDoctor || v.status !== 'Normal')
      }));

      if (geminiRes.data.aiSummary) aiSummary = geminiRes.data.aiSummary;
      if (Array.isArray(geminiRes.data.doctorQuestions) && geminiRes.data.doctorQuestions.length > 0) {
        doctorQuestions = geminiRes.data.doctorQuestions;
      }
      if (geminiRes.data.overallHealthRisk) overallHealthRisk = geminiRes.data.overallHealthRisk;
    }
  } catch (err) {
    // Continue to text fallback
  }

  // 2. If Gemini didn't extract or is in offline dev mode, use deterministic regex matcher on rawText
  if (extractedValues.length === 0 && rawText && rawText.trim()) {
    extractedValues = extractValuesFromText(rawText);
  }

  // 3. Handle Empty State Honestly (No dummy numbers)
  if (extractedValues.length === 0) {
    overallHealthRisk = 'No Biomarkers Detected';
    aiSummary = `No clinical biomarker parameters could be identified from "${originalFilename}". Please ensure the uploaded file is a clear, legible laboratory diagnostic report or enter your lab test parameters directly.`;
    doctorQuestions = [
      'Which specific laboratory diagnostic tests are recommended for my routine wellness checkup?',
      'Are there specific biomarkers I should have tested based on my family health history?'
    ];
  } else {
    const flaggedCount = extractedValues.filter(v => v.status !== 'Normal').length;
    if (flaggedCount > 2) overallHealthRisk = 'Critical Attention';
    else if (flaggedCount > 0) overallHealthRisk = 'Attention Needed';
    else overallHealthRisk = 'Normal';

    if (!aiSummary) {
      aiSummary = `Analysis of "${originalFilename}" identified ${extractedValues.length} key biomarker parameter(s). ${
        flaggedCount === 0
          ? 'All extracted parameters appear within standard clinical reference ranges.'
          : `${flaggedCount} parameter(s) lie outside standard reference ranges and warrant physician review.`
      } Note: Laboratory reference intervals may vary slightly between diagnostic testing facilities.`;
    }

    if (doctorQuestions.length === 0) {
      doctorQuestions = [
        'Are these parameter values clinically significant given my current lifestyle?',
        'Should we repeat any specific test within 3 to 6 months to monitor trends?',
        'Are there dietary or physical exercise adjustments recommended before considering medications?'
      ];
    }
  }

  return {
    aiSummary,
    extractedValues,
    doctorQuestions,
    overallHealthRisk,
    disclaimer: 'This medical report extraction is generated by AI OCR and natural language processing. It is not a clinical diagnosis. Always share your complete physical lab report with your physician.'
  };
};

module.exports = {
  analyzeMedicalReport,
  extractValuesFromText,
  STANDARD_REFERENCE_RANGES
};
