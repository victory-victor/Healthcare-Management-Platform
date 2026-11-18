/**
 * Automated Test Runner for MedAI Nexus Backend API
 */

const assert = require('assert');
const bcrypt = require('bcryptjs');
const dbAdapter = require('../services/dbAdapter');
const { analyzeSymptoms } = require('../ai/symptomAI');
const { analyzeMedicalReport } = require('../ai/medicalReportAI');
const { analyzePrescription } = require('../ai/prescriptionAI');
const { generate7DayDietPlan } = require('../ai/dietAI');
const { recommendSpecialty } = require('../ai/doctorRecommendationAI');
const { generateAccessToken, verifyAccessToken } = require('../utils/jwt');

async function runTestSuite() {
  console.log('🧪 Starting MedAI Nexus Automated Test Suite...\n');
  let passedCount = 0;
  let totalCount = 0;

  const test = async (name, fn) => {
    totalCount++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  };

  // 1. Authentication & JWT Security Tests
  await test('JWT Access Token Generation & Decryption', async () => {
    const dummyUser = { id: 'usr-12345', email: 'test@medainexus.com', role: 'patient', name: 'Test User' };
    const token = generateAccessToken(dummyUser);
    assert(typeof token === 'string' && token.length > 20, 'Token should be a non-empty string');
    const decoded = verifyAccessToken(token);
    assert.strictEqual(decoded.email, dummyUser.email);
    assert.strictEqual(decoded.role, 'patient');
  });

  await test('Bcrypt Password Hashing & Comparison', async () => {
    const rawPass = 'SecureHealthcare@2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPass, salt);
    const isValid = await bcrypt.compare(rawPass, hash);
    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isValid, true);
    assert.strictEqual(isInvalid, false);

    // Verify dbAdapter returns password on User query
    await dbAdapter.create('User', {
      name: 'Bcrypt Verification User',
      email: 'bcrypt_test@medainexus.com',
      password: hash,
      role: 'patient'
    });
    const foundUser = await dbAdapter.findOne('User', { email: 'bcrypt_test@medainexus.com' }, '+password');
    assert(foundUser, 'User should be found in db');
    assert(foundUser.password, 'User password field must not be undefined');
    const dbMatch = await bcrypt.compare(rawPass, foundUser.password);
    assert.strictEqual(dbMatch, true, 'User password from db should match');
  });

  // 2. Module 2: AI Symptom Analysis & Emergency Triage Tests
  await test('AI Symptom Analysis - Standard Upper Respiratory', async () => {
    const res = await analyzeSymptoms({
      symptoms: ['dry cough', 'sore throat', 'mild fever'],
      duration: '2 days',
      severity: 'moderate',
      frequency: 'constant',
      age: 28
    });
    assert(res.symptomSummary.includes('dry cough'), 'Summary should capture symptoms');
    assert.strictEqual(res.isEmergency, false, 'Non-emergency symptoms should not trigger emergency');
    assert(res.potentialConditions.length > 0, 'Should return potential conditions');
    assert(res.medicalDisclaimer.length > 10, 'Should include medical disclaimer');
  });

  await test('AI Symptom Analysis - Emergency Triage Escalation', async () => {
    const res = await analyzeSymptoms({
      symptoms: ['crushing chest pain', 'shortness of breath', 'blue lips'],
      duration: '30 minutes',
      severity: 'severe',
      frequency: 'constant',
      age: 55
    });
    assert.strictEqual(res.isEmergency, true, 'Life-threatening symptoms must trigger emergency');
    assert.strictEqual(res.levelOfConcern, 'Emergency', 'Level of concern must be Emergency');
    assert(res.emergencyInstructions.includes('911'), 'Must include 911 / emergency hotline instructions');
  });

  // 3. Module 3: Medical Report OCR & Lab Extraction Tests
  await test('Medical Report Analysis - Parameter Extraction & Flagging', async () => {
    const rawText = `
      Hemoglobin: 11.2 g/dL
      Fasting Blood Glucose: 115 mg/dL
      Serum Creatinine: 0.9 mg/dL
    `;
    const res = await analyzeMedicalReport({ rawText, originalFilename: 'test_lab.pdf' });
    assert(res.extractedValues.length >= 3, 'Should extract parameters');
    const hgb = res.extractedValues.find(v => v.parameter.includes('Hemoglobin'));
    assert(hgb, 'Hemoglobin parameter should be extracted');
    assert.strictEqual(hgb.status, 'Below reference range', '11.2 g/dL should be flagged as Below reference range');
  });

  // 4. Module 4: Prescription Scanner & Medication Reminders
  await test('Prescription Scanner - Extract Medicines & Dosages', async () => {
    const rawOcr = 'Rx: Amoxicillin 500mg tid 5 days after food. Pantoprazole 40mg od before breakfast.';
    const res = await analyzePrescription({ rawText: rawOcr, originalFilename: 'rx_test.png' });
    assert(res.medicines.length >= 2, 'Should extract multiple medicines');
    const amox = res.medicines.find(m => m.medicineName.includes('Amoxicillin'));
    assert(amox, 'Should identify Amoxicillin');
    assert.strictEqual(amox.beforeAfterFood, 'After food');
  });

  // 5. Module 5: Diet Planner Macro & 7-Day Plan Generation
  await test('AI Diet Planner - 7-Day Caloric & Macro Calculation', async () => {
    const plan = await generate7DayDietPlan({
      age: 32,
      height: 175,
      weight: 75,
      dietaryPreference: 'vegetarian',
      healthGoals: ['Weight management']
    });
    assert(plan.dailyCalorieTarget > 1200 && plan.dailyCalorieTarget < 3000, 'Caloric target should be physiological');
    assert.strictEqual(plan.days.length, 7, 'Must generate exactly 7 days');
    assert(plan.groceryList.length > 0, 'Must include grocery items');
  });

  // 6. Module 6: Doctor Recommendation AI Tests
  await test('Doctor Recommendation AI - Specialty Keyword Matching', () => {
    const heartRec = recommendSpecialty('I have persistent chest pressure and heart palpitations');
    assert.strictEqual(heartRec.specialty, 'Cardiologist');

    const neuroRec = recommendSpecialty('Severe migraine and unilateral headache');
    assert.strictEqual(neuroRec.specialty, 'Neurologist');
  });

  console.log(`\n===========================================`);
  console.log(`🏁 Test Results: ${passedCount}/${totalCount} tests passed (${Math.round((passedCount/totalCount)*100)}%)`);
  console.log(`===========================================\n`);
}

runTestSuite();
