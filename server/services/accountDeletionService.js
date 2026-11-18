const fs = require('fs');
const path = require('path');
const dbAdapter = require('./dbAdapter');

/**
 * Permanently and comprehensively purges ALL data belonging to a single user.
 * Strictly guarantees that ONLY this user's records are deleted.
 *
 * @param {string|Object} userId
 * @returns {Promise<Object>} deletion summary metrics
 */
const purgeUserData = async (userId) => {
  const uIdStr = String(userId);
  if (!uIdStr) throw new Error('Valid User ID required for account deletion.');

  const metrics = {
    userId: uIdStr,
    purgedAt: new Date().toISOString(),
    reports: 0,
    filesRemoved: 0,
    prescriptions: 0,
    appointments: 0,
    symptoms: 0,
    dietPlans: 0,
    healthMetrics: 0,
    notifications: 0,
    messages: 0,
    consents: 0,
    sessions: 0,
    profileDeleted: false,
    userDeleted: false
  };

  // 1. Delete Medical Reports and their physical files on disk
  const userReports = await dbAdapter.find('MedicalReport', { user: uIdStr });
  for (const report of userReports) {
    if (report.filePath && fs.existsSync(report.filePath)) {
      try {
        fs.unlinkSync(report.filePath);
        metrics.filesRemoved++;
      } catch (e) {}
    }
    // Delete extracted biomarkers for this report
    await dbAdapter.deleteMany('ExtractedMedicalValue', { report: report._id || report.id });
  }
  await dbAdapter.deleteMany('ExtractedMedicalValue', { user: uIdStr });
  const repDel = await dbAdapter.deleteMany('MedicalReport', { user: uIdStr });
  metrics.reports = repDel?.deletedCount || userReports.length;

  // 2. Delete Prescriptions, Medicines, Reminders and physical files
  const userPrescriptions = await dbAdapter.find('Prescription', { user: uIdStr });
  for (const rx of userPrescriptions) {
    if (rx.filePath && !rx.filePath.startsWith('digital://') && fs.existsSync(rx.filePath)) {
      try {
        fs.unlinkSync(rx.filePath);
        metrics.filesRemoved++;
      } catch (e) {}
    }
    await dbAdapter.deleteMany('PrescriptionMedicine', { prescription: rx._id || rx.id });
  }
  await dbAdapter.deleteMany('PrescriptionMedicine', { user: uIdStr });
  await dbAdapter.deleteMany('MedicationReminder', { user: uIdStr });
  const rxDel = await dbAdapter.deleteMany('Prescription', { user: uIdStr });
  metrics.prescriptions = rxDel?.deletedCount || userPrescriptions.length;

  // 3. Delete Symptom Analysis Results and Records
  const symDel = await dbAdapter.deleteMany('SymptomAnalysis', { user: uIdStr });
  await dbAdapter.deleteMany('SymptomRecord', { user: uIdStr });
  metrics.symptoms = symDel?.deletedCount || 0;

  // 4. Delete Diet Plans, Meals, and Nutrition Analyses
  const userDietPlans = await dbAdapter.find('DietPlan', { user: uIdStr });
  for (const plan of userDietPlans) {
    await dbAdapter.deleteMany('DietMeal', { dietPlan: plan._id || plan.id });
  }
  await dbAdapter.deleteMany('DietMeal', { user: uIdStr });
  await dbAdapter.deleteMany('NutritionAnalysis', { user: uIdStr });
  const dietDel = await dbAdapter.deleteMany('DietPlan', { user: uIdStr });
  metrics.dietPlans = dietDel?.deletedCount || userDietPlans.length;

  // 5. Delete Health Metrics (vitals, blood pressure, etc.)
  const hmDel = await dbAdapter.deleteMany('HealthMetric', { user: uIdStr });
  metrics.healthMetrics = hmDel?.deletedCount || 0;

  // 6. Delete Appointments (Patient or Doctor side)
  const apptDel = await dbAdapter.deleteMany('Appointment', { patient: uIdStr });
  metrics.appointments = apptDel?.deletedCount || 0;

  // 7. Delete Chat Conversations and Messages
  const conversations = await dbAdapter.find('ChatConversation', { user: uIdStr });
  for (const c of conversations) {
    await dbAdapter.deleteMany('ChatMessage', { conversation: c._id || c.id });
  }
  await dbAdapter.deleteMany('ChatMessage', { sender: uIdStr });
  await dbAdapter.deleteMany('ChatConversation', { user: uIdStr });
  metrics.messages = conversations.length;

  // 8. Delete In-App Notifications
  const notifDel = await dbAdapter.deleteMany('Notification', { user: uIdStr });
  metrics.notifications = notifDel?.deletedCount || 0;

  // 9. Delete Consent Records
  const conDel = await dbAdapter.deleteMany('ConsentRecord', { user: uIdStr });
  metrics.consents = conDel?.deletedCount || 0;

  // 10. Delete Active User Sessions / Refresh Tokens
  await dbAdapter.deleteMany('UserSession', { user: uIdStr });

  // 11. Delete Profile (Patient or Doctor)
  const patientProfile = await dbAdapter.findOne('PatientProfile', { user: uIdStr });
  if (patientProfile) {
    await dbAdapter.findByIdAndDelete('PatientProfile', patientProfile._id || patientProfile.id);
    metrics.profileDeleted = true;
  }

  const doctorProfile = await dbAdapter.findOne('DoctorProfile', { user: uIdStr });
  if (doctorProfile) {
    const docId = doctorProfile._id || doctorProfile.id;
    await dbAdapter.deleteMany('DoctorAvailability', { doctor: docId });
    await dbAdapter.deleteMany('Appointment', { doctor: docId });
    await dbAdapter.findByIdAndDelete('DoctorProfile', docId);
    metrics.profileDeleted = true;
  }

  // 12. Delete User Account itself
  await dbAdapter.findByIdAndDelete('User', uIdStr);
  metrics.userDeleted = true;

  return metrics;
};

module.exports = {
  purgeUserData
};
