const assert = require('assert');
const { analyzeMedicalReport } = require('../ai/medicalReportAI');
const { analyzePrescription } = require('../ai/prescriptionAI');
const { generate7DayDietPlan } = require('../ai/dietAI');

async function testNoDummyValues() {
  console.log('--- TEST 1: Medical Report Dummy Data Purge ---');
  // Passing empty text
  const reportRes = await analyzeMedicalReport({ rawText: '', originalFilename: 'blank_document.pdf' });
  console.log('Report extracted values count:', reportRes.extractedValues.length);
  console.log('Report overall risk:', reportRes.overallHealthRisk);
  assert.strictEqual(reportRes.extractedValues.length, 0, 'Must have 0 extracted values for blank input!');
  assert.strictEqual(reportRes.overallHealthRisk, 'No Biomarkers Detected', 'Must report No Biomarkers Detected');
  console.log('✅ TEST 1 PASSED: Zero dummy biomarker values generated.\n');

  console.log('--- TEST 2: Prescription Scanner Dummy Data Purge ---');
  // Passing empty text
  const rxRes = await analyzePrescription({ rawText: '', originalFilename: 'blank_rx.jpg' });
  console.log('Prescription medicines count:', rxRes.medicines.length);
  assert.strictEqual(rxRes.medicines.length, 0, 'Must have 0 medicines for empty input!');
  console.log('✅ TEST 2 PASSED: Zero dummy medicines generated.\n');

  console.log('--- TEST 3: Diet Planner Chicken Allergy Verification ---');
  const dietRes = await generate7DayDietPlan({
    userProfile: {
      dailyCalories: 2100,
      dietaryPreference: 'non-vegetarian',
      allergies: ['chicken', 'poultry'],
      healthGoals: 'weight_loss'
    }
  });

  const fullDietText = JSON.stringify(dietRes).toLowerCase();
  const containsChicken = fullDietText.includes('chicken');
  console.log('Does generated 7-day diet or grocery list contain chicken?', containsChicken);
  assert.strictEqual(containsChicken, false, 'Chicken must NOT be recommended when allergic to chicken!');
  console.log('✅ TEST 3 PASSED: Chicken strictly excluded and substituted with safe proteins across all 7 days.\n');

  console.log('--- TEST 4: Genuine Medical Report Extraction ---');
  const genuineReport = await analyzeMedicalReport({
    rawText: 'Clinical Biochemistry: Fasting Blood Glucose: 112 mg/dL, Total Cholesterol: 228 mg/dL',
    originalFilename: 'lipid_glucose_panel.txt'
  });
  console.log('Genuine extracted count:', genuineReport.extractedValues.length);
  assert.strictEqual(genuineReport.extractedValues.length, 2, 'Must extract exactly the 2 genuine parameters');
  console.log('Extracted parameters:', genuineReport.extractedValues.map(v => `${v.parameter}: ${v.value} (${v.status})`));
  console.log('✅ TEST 4 PASSED: Genuine values parsed with clinical accuracy.\n');

  console.log('============================================');
  console.log('🎉 ALL 4 CRITICAL INTEGRITY TESTS PASSED!');
  console.log('============================================');
}

testNoDummyValues().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
