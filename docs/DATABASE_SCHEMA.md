# MedAI Nexus — Database Architecture & Schema Specification

MedAI Nexus utilizes **MongoDB** with **Mongoose ODM**. All collections are designed with strict data validation, ObjectId references, indexes on frequently queried fields, and automated audit trails.

---

## Complete List of 24 Collections

1. **`users`**
   - Core authentication, passwords (hashed with bcrypt), roles (`patient`, `doctor`, `admin`), email verification, and refresh tokens.
   - *Indexes*: `{ email: 1 }` (unique), `{ role: 1 }`.

2. **`patientProfiles`**
   - Reference: `{ user: ObjectId, ref: 'User' }` (unique).
   - Clinical attributes: `dateOfBirth`, `gender`, `bloodGroup`, `heightCm`, `weightKg`, `allergies` (array), `existingConditions` (array), `currentMedications` (array), `emergencyContact` (nested), `city`, `address`, `dietaryPreference`, `healthGoals`.

3. **`doctorProfiles`**
   - Reference: `{ user: ObjectId, ref: 'User' }` (unique).
   - Fields: `fullName`, `specialty`, `qualifications`, `experienceYears`, `registrationNumber`, `hospital`, `consultationFees`, `city`, `rating`, `reviewsCount`, `isVerified`, `availableSlots` (array), `consultationTypes`.
   - *Indexes*: `{ specialty: 1 }`, `{ city: 1 }`, `{ isVerified: 1 }`.

4. **`hospitals`**
   - Directory of verified medical centers and clinics: `name`, `address`, `city`, `state`, `phone`, `email`, `rating`, `emergencyAvailable`, `latitude`, `longitude`.

5. **`specialties`**
   - Clinical medical specialties: `name` (unique), `description`, `icon`, `commonConditions`, `isActive`.

6. **`doctorAvailability`**
   - Working day schedules and time slots per physician: `{ doctor: ObjectId, ref: 'DoctorProfile' }`, `dayOfWeek`, `startTime`, `endTime`, `slots`, `isAvailable`.

7. **`appointments`**
   - Patient bookings: `{ patient: ObjectId, ref: 'User' }`, `{ doctor: ObjectId, ref: 'DoctorProfile' }`, `appointmentDate`, `timeSlot`, `consultationType` (`online` | `offline`), `status` (`pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`), `reasonForVisit`, `doctorNotes`, `meetingLink`.
   - *Indexes*: `{ patient: 1, appointmentDate: 1 }`, `{ doctor: 1, appointmentDate: 1, timeSlot: 1 }`.

8. **`symptomRecords`**
   - Raw input record: `{ user: ObjectId, ref: 'User' }`, `symptoms` (array), `duration`, `severity`, `frequency`, `age`, `existingConditions`, `currentMedications`.

9. **`symptomAnalysisResults`**
   - AI clinical triage results: `{ record: ObjectId, ref: 'SymptomRecord' }`, `symptomSummary`, `possibleExplanations` (array), `potentialConditions` (array of objects with probability & explanation), `levelOfConcern`, `warningSigns`, `suggestedSpecialty`, `whenToConsultDoctor`, `isEmergency`, `emergencyInstructions`, `medicalDisclaimer`.

10. **`medicalReports`**
    - File upload metadata: `{ user: ObjectId, ref: 'User' }`, `title`, `originalFilename`, `storedFilename`, `filePath`, `fileSize`, `mimeType`, `status`, `ocrRawText`, `aiSummary`, `doctorQuestions`, `overallHealthRisk`.

11. **`extractedMedicalValues`**
    - Parsed laboratory biomarker parameters: `{ report: ObjectId, ref: 'MedicalReport' }`, `{ user: ObjectId, ref: 'User' }`, `parameter`, `value`, `numericalValue`, `unit`, `referenceRange`, `status` (`Normal`, `Above reference range`, `Below reference range`, `Unknown/unavailable`), `explanation`, `isFlaggedForDoctor`.

12. **`prescriptions`**
    - Uploaded prescription metadata: `{ user: ObjectId, ref: 'User' }`, `title`, `originalFilename`, `filePath`, `ocrRawText`, `prescribingDoctor`, `prescriptionDate`, `status`, `notes`.

13. **`prescriptionMedicines`**
    - Individual parsed medicines: `{ prescription: ObjectId, ref: 'Prescription' }`, `{ user: ObjectId, ref: 'User' }`, `medicineName`, `brandName`, `strength`, `dosage`, `frequency`, `duration`, `instructions`, `beforeAfterFood`, `confidenceFlag`.

14. **`medicationReminders`**
    - Active daily medication schedule: `{ medicine: ObjectId, ref: 'PrescriptionMedicine' }`, `medicineName`, `dosage`, `timeOfDay`, `daysOfWeek`, `isActive`, `statusToday` (`pending`, `taken`, `skipped`), `lastTakenAt`.

15. **`dietPlans`**
    - 7-day personalized nutrition plan: `{ user: ObjectId, ref: 'User' }`, `title`, `healthGoal`, `dietaryPreference`, `dailyCalorieTarget`, `macroTargets` (protein, carbs, fats), `waterTargetMl`, `groceryList`, `aiNutritionTips`, `isActive`.

16. **`dietMeals`**
    - 5 daily meals across the 7 days: `{ dietPlan: ObjectId, ref: 'DietPlan' }`, `dayNumber` (1-7), `mealType` (`breakfast`, `morning_snack`, `lunch`, `evening_snack`, `dinner`), `foodItems` (array), `portionSizes`, `estimatedCalories`, `proteinGrams`, `carbsGrams`, `fatsGrams`, `nutritionExplanation`.

17. **`nutritionRecords`**
    - Daily logging metrics: `{ user: ObjectId, ref: 'User' }`, `recordDate`, `waterIntakeMl`, `targetWaterMl`, `caloriesConsumed`, `mealsCompletedCount`, `notes`.

18. **`healthMetrics`**
    - Longitudinal vital signs: `{ user: ObjectId, ref: 'User' }`, `recordedDate`, `weightKg`, `systolicBp`, `diastolicBp`, `bloodGlucoseMgDl`, `heartRateBpm`, `oxygenSaturationPct`.

19. **`chatConversations`**
    - AI Health Assistant chat threads: `{ user: ObjectId, ref: 'User' }`, `title`, `contextAllowed` (boolean), `lastMessageAt`.

20. **`chatMessages`**
    - Messages: `{ conversation: ObjectId, ref: 'ChatConversation' }`, `{ user: ObjectId, ref: 'User' }`, `role` (`user`, `assistant`, `system`), `content`, `contextReferenced`, `isEmergencyAlert`, `suggestedSpecialty`.

21. **`notifications`**
    - Patient in-app alerts: `{ user: ObjectId, ref: 'User' }`, `title`, `message`, `type` (`appointment`, `medication`, `report`, `security`, `diet`, `system`), `referenceId`, `isRead`.

22. **`consentRecords`**
    - Privacy consents: `{ user: ObjectId, ref: 'User' }`, `consentType` (`medical_data_processing`, `ai_analysis`, `notifications`, `telehealth_terms`), `isGranted`, `grantedAt`, `revokedAt`, `ipAddress`, `version`.

23. **`auditLogs`**
    - Immutable security audit logs: `{ user: ObjectId, ref: 'User' }`, `action`, `resource`, `resourceId`, `status` (`SUCCESS`, `FAILURE`, `BLOCKED`), `details`, `ipAddress`, `userAgent`.

24. **`userSessions`**
    - Active sessions: `{ user: ObjectId, ref: 'User' }`, `refreshToken`, `userAgent`, `ipAddress`, `expiresAt`, `isValid`.
