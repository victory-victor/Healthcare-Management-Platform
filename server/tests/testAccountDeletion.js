const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dbAdapter = require('../services/dbAdapter');
const { purgeUserData } = require('../services/accountDeletionService');
const models = require('../models');

async function testCascadeAccountDeletionIsolation() {
  console.log('--- TEST: Comprehensive Account Deletion & User Isolation ---');

  const timestamp = Date.now();

  // 1. Create User A (The user who will delete their account)
  const userA = await dbAdapter.create('User', {
    name: 'Alice Victim',
    email: `alice_${timestamp}@example.com`,
    password: 'Password123!',
    role: 'patient',
    isEmailVerified: true
  });
  const uIdA = userA._id || userA.id;

  // 2. Create User B (Another independent user whose data must NEVER be touched)
  const userB = await dbAdapter.create('User', {
    name: 'Bob Innocent',
    email: `bob_${timestamp}@example.com`,
    password: 'Password123!',
    role: 'patient',
    isEmailVerified: true
  });
  const uIdB = userB._id || userB.id;

  // 3. Create dummy file for User A
  const tempUploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(tempUploadDir)) fs.mkdirSync(tempUploadDir, { recursive: true });
  const testFileA = path.join(tempUploadDir, `test_report_${timestamp}.txt`);
  fs.writeFileSync(testFileA, 'Clinical blood test data for Alice');

  // Populate rich data for User A
  await dbAdapter.create('PatientProfile', { user: uIdA, bloodGroup: 'O+', heightCm: 165 });
  const repA = await dbAdapter.create('MedicalReport', { user: uIdA, title: 'Alice CBC', filePath: testFileA });
  await dbAdapter.create('ExtractedMedicalValue', { report: repA._id || repA.id, user: uIdA, parameter: 'Hemoglobin', value: '14.0' });
  const rxA = await dbAdapter.create('Prescription', { user: uIdA, title: 'Alice Rx' });
  await dbAdapter.create('PrescriptionMedicine', { prescription: rxA._id || rxA.id, user: uIdA, medicineName: 'Amoxicillin' });
  await dbAdapter.create('MedicationReminder', { user: uIdA, medicineName: 'Amoxicillin', timeOfDay: '08:00 AM' });
  await dbAdapter.create('SymptomAnalysis', { user: uIdA, symptoms: ['fever'] });
  const dietA = await dbAdapter.create('DietPlan', { user: uIdA, title: 'Alice Diet' });
  await dbAdapter.create('DietMeal', { dietPlan: dietA._id || dietA.id, user: uIdA, mealType: 'lunch' });
  await dbAdapter.create('HealthMetric', { user: uIdA, metricType: 'blood_pressure', value: '120/80' });
  await dbAdapter.create('Notification', { user: uIdA, title: 'Welcome Alice' });
  await dbAdapter.create('ConsentRecord', { user: uIdA, consentType: 'ai_analysis', isGranted: true });
  await dbAdapter.create('UserSession', { user: uIdA, refreshToken: 'token_alice' });

  // 4. Populate data for User B
  await dbAdapter.create('PatientProfile', { user: uIdB, bloodGroup: 'B+', heightCm: 180 });
  const repB = await dbAdapter.create('MedicalReport', { user: uIdB, title: 'Bob Lipid Panel' });
  await dbAdapter.create('ExtractedMedicalValue', { report: repB._id || repB.id, user: uIdB, parameter: 'Cholesterol', value: '190' });
  const rxB = await dbAdapter.create('Prescription', { user: uIdB, title: 'Bob Rx' });
  await dbAdapter.create('PrescriptionMedicine', { prescription: rxB._id || rxB.id, user: uIdB, medicineName: 'Metformin' });
  await dbAdapter.create('MedicationReminder', { user: uIdB, medicineName: 'Metformin', timeOfDay: '09:00 AM' });
  await dbAdapter.create('Notification', { user: uIdB, title: 'Welcome Bob' });
  await dbAdapter.create('ConsentRecord', { user: uIdB, consentType: 'ai_analysis', isGranted: true });

  console.log('User A and User B data populated successfully.');

  // Verify file exists before purge
  assert.strictEqual(fs.existsSync(testFileA), true, 'File A must exist before purge');

  // 5. PURGE USER A ONLY
  console.log('Purging User A account...');
  const purgeResult = await purgeUserData(uIdA);
  console.log('Purge summary:', purgeResult);

  // 6. ASSERT USER A DATA IS 100% GONE
  const userACheck = await dbAdapter.findById('User', uIdA);
  assert.strictEqual(userACheck, null, 'User A record must be deleted');

  const profileACheck = await dbAdapter.findOne('PatientProfile', { user: uIdA });
  assert.strictEqual(profileACheck, null, 'User A profile must be deleted');

  const reportsACheck = await dbAdapter.find('MedicalReport', { user: uIdA });
  assert.strictEqual(reportsACheck.length, 0, 'User A reports must be 0');

  const biomarkersACheck = await dbAdapter.find('ExtractedMedicalValue', { user: uIdA });
  assert.strictEqual(biomarkersACheck.length, 0, 'User A biomarkers must be 0');

  const rxACheck = await dbAdapter.find('Prescription', { user: uIdA });
  assert.strictEqual(rxACheck.length, 0, 'User A prescriptions must be 0');

  const medsACheck = await dbAdapter.find('PrescriptionMedicine', { user: uIdA });
  assert.strictEqual(medsACheck.length, 0, 'User A medicines must be 0');

  const remindersACheck = await dbAdapter.find('MedicationReminder', { user: uIdA });
  assert.strictEqual(remindersACheck.length, 0, 'User A reminders must be 0');

  const dietACheck = await dbAdapter.find('DietPlan', { user: uIdA });
  assert.strictEqual(dietACheck.length, 0, 'User A diet plans must be 0');

  const notifsACheck = await dbAdapter.find('Notification', { user: uIdA });
  assert.strictEqual(notifsACheck.length, 0, 'User A notifications must be 0');

  const consentsACheck = await dbAdapter.find('ConsentRecord', { user: uIdA });
  assert.strictEqual(consentsACheck.length, 0, 'User A consents must be 0');

  const sessionsACheck = await dbAdapter.find('UserSession', { user: uIdA });
  assert.strictEqual(sessionsACheck.length, 0, 'User A sessions must be 0');

  assert.strictEqual(fs.existsSync(testFileA), false, 'File A must be physically deleted from disk');
  console.log('✅ ALL User A records and uploaded files 100% wiped.\n');

  // 7. ASSERT USER B DATA IS 100% INTACT AND UNTOUCHED
  console.log('Verifying User B isolation...');
  const userBCheck = await dbAdapter.findById('User', uIdB);
  assert.ok(userBCheck, 'User B account must be intact');

  const profileBCheck = await dbAdapter.findOne('PatientProfile', { user: uIdB });
  assert.ok(profileBCheck, 'User B profile must be intact');
  assert.strictEqual(profileBCheck.bloodGroup, 'B+');

  const reportsBCheck = await dbAdapter.find('MedicalReport', { user: uIdB });
  assert.strictEqual(reportsBCheck.length, 1, 'User B must still have their 1 report');
  assert.strictEqual(reportsBCheck[0].title, 'Bob Lipid Panel');

  const biomarkersBCheck = await dbAdapter.find('ExtractedMedicalValue', { user: uIdB });
  assert.strictEqual(biomarkersBCheck.length, 1, 'User B biomarkers must still be 1');

  const rxBCheck = await dbAdapter.find('Prescription', { user: uIdB });
  assert.strictEqual(rxBCheck.length, 1, 'User B prescriptions must still be 1');

  const medsBCheck = await dbAdapter.find('PrescriptionMedicine', { user: uIdB });
  assert.strictEqual(medsBCheck.length, 1, 'User B medicines must still be 1');

  const remindersBCheck = await dbAdapter.find('MedicationReminder', { user: uIdB });
  assert.strictEqual(remindersBCheck.length, 1, 'User B reminders must still be 1');

  const notifsBCheck = await dbAdapter.find('Notification', { user: uIdB });
  assert.strictEqual(notifsBCheck.length, 1, 'User B notifications must still be 1');

  const consentsBCheck = await dbAdapter.find('ConsentRecord', { user: uIdB });
  assert.strictEqual(consentsBCheck.length, 1, 'User B consents must still be 1');

  console.log('✅ User B data 100% INTACT! Perfect isolation confirmed.\n');

  console.log('============================================');
  console.log('🎉 ACCOUNT DELETION ISOLATION TEST PASSED!');
  console.log('============================================');

  // Clean up User B
  await purgeUserData(uIdB);
}

testCascadeAccountDeletionIsolation().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
