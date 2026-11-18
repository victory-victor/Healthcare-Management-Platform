const assert = require('assert');
const dbAdapter = require('../services/dbAdapter');
const models = require('../models');

async function testDoctorPrescribeAndReports() {
  console.log('--- TEST: Doctor Digital Prescription Creation ---');
  
  // Find or create test patient
  let patient = await dbAdapter.findOne('User', { role: 'patient' });
  if (!patient) {
    patient = await dbAdapter.create('User', {
      name: 'Test Patient',
      email: `patient_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'patient',
      isEmailVerified: true
    });
  }

  // Find or create test doctor
  let doctorUser = await dbAdapter.findOne('User', { role: 'doctor' });
  if (!doctorUser) {
    doctorUser = await dbAdapter.create('User', {
      name: 'Dr. Test Specialist',
      email: `doctor_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'doctor',
      isEmailVerified: true
    });
  }

  let doctorProfile = await dbAdapter.findOne('DoctorProfile', { user: doctorUser._id || doctorUser.id });
  if (!doctorProfile) {
    doctorProfile = await dbAdapter.create('DoctorProfile', {
      user: doctorUser._id || doctorUser.id,
      fullName: doctorUser.name,
      specialty: 'Internal Medicine',
      qualifications: 'MD, MBBS',
      registrationNumber: 'MED-12345',
      hospital: 'Metro Health Hospital',
      consultationFees: 80,
      isVerified: true
    });
  }

  // 1. Test Digital Prescription Creation (Simulating Doctor Prescribing)
  const prescription = await dbAdapter.create('Prescription', {
    user: patient._id || patient.id,
    title: `Rx: Acute Pharyngitis (by Dr. ${doctorProfile.fullName})`,
    originalFilename: `Digital_Prescription_${Date.now()}.pdf`,
    storedFilename: `digital_rx_${Date.now()}`,
    filePath: 'digital://in-app-rx',
    prescribingDoctor: doctorProfile.fullName,
    prescriptionDate: new Date(),
    status: 'verified',
    notes: 'Rest and adequate hydration.'
  });

  console.log('Prescription created successfully:', prescription._id || prescription.id);
  assert.ok(prescription._id || prescription.id, 'Prescription must be created');
  assert.strictEqual(prescription.status, 'verified', 'Status must be verified');
  console.log('✅ Digital Prescription created without schema validation errors!\n');

  // 2. Test Prescription Medicine Creation
  const med = await dbAdapter.create('PrescriptionMedicine', {
    prescription: prescription._id || prescription.id,
    user: patient._id || patient.id,
    medicineName: 'Amoxicillin 500mg',
    dosage: '1 capsule',
    frequency: 'Three times daily',
    duration: '7 days',
    instructions: 'Take after meals',
    beforeAfterFood: 'After food',
    confidenceFlag: 'Verified High Confidence'
  });
  console.log('Prescription medicine created:', med.medicineName);
  assert.ok(med._id || med.id);
  console.log('✅ PrescriptionMedicine created successfully!\n');

  // 3. Test Medical Report Creation & Biomarkers for Patient
  const report = await dbAdapter.create('MedicalReport', {
    user: patient._id || patient.id,
    title: 'Complete Blood Count & Metabolic Panel',
    originalFilename: 'cbc_panel.pdf',
    storedFilename: 'cbc_panel_123.pdf',
    filePath: 'uploads/cbc_panel_123.pdf',
    status: 'analyzed',
    aiSummary: 'Mildly elevated fasting glucose. Hemoglobin normal.',
    overallHealthRisk: 'Attention Needed'
  });

  const biomarker1 = await dbAdapter.create('ExtractedMedicalValue', {
    report: report._id || report.id,
    user: patient._id || patient.id,
    parameter: 'Fasting Blood Glucose',
    value: '108',
    numericalValue: 108,
    unit: 'mg/dL',
    referenceRange: '70 - 99 mg/dL',
    status: 'Above reference range',
    explanation: 'Slightly above standard fasting range.'
  });

  const biomarker2 = await dbAdapter.create('ExtractedMedicalValue', {
    report: report._id || report.id,
    user: patient._id || patient.id,
    parameter: 'Hemoglobin',
    value: '14.5',
    numericalValue: 14.5,
    unit: 'g/dL',
    referenceRange: '13.5 - 17.5 g/dL',
    status: 'Normal',
    explanation: 'Oxygen-carrying protein in red blood cells.'
  });

  // Verify fetching report with values
  const fetchedReport = await dbAdapter.findById('MedicalReport', report._id || report.id);
  const fetchedValues = await dbAdapter.find('ExtractedMedicalValue', { report: report._id || report.id });
  console.log('Fetched report:', fetchedReport.title);
  console.log('Extracted biomarkers count:', fetchedValues.length);
  assert.strictEqual(fetchedValues.length, 2, 'Report must have 2 biomarkers');
  console.log('✅ Doctor can inspect full patient report with all extracted biomarkers!\n');

  console.log('============================================');
  console.log('🎉 ALL DOCTOR PRESCRIPTION & REPORT TESTS PASSED!');
  console.log('============================================');
}

testDoctorPrescribeAndReports().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
