# MedAI Nexus — API Documentation

This document specifies the complete RESTful API contract for the **MedAI Nexus** Smart Healthcare Management Platform built on the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

Base URL: `http://localhost:5000/api`

---

## 1. Authentication & User Management (`/api/auth`)

### 1.1 Register User
- **Method & Route**: `POST /api/auth/register`
- **Rate Limit**: 30 requests / 15 minutes
- **Request Body**:
  ```json
  {
    "name": "Sarah Smith",
    "email": "sarah.smith@example.com",
    "password": "Password@123",
    "role": "patient", // "patient" | "doctor" | "admin"
    "phone": "+1-555-0199",
    "specialty": "Cardiologist", // optional for doctor
    "qualifications": "MD, FACC" // optional for doctor
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Account created successfully.",
    "token": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "664fa...",
      "name": "Sarah Smith",
      "email": "sarah.smith@example.com",
      "role": "patient",
      "isEmailVerified": true
    }
  }
  ```

### 1.2 Login User
- **Method & Route**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "patient@medainexus.com",
    "password": "Patient@123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Logged in successfully.",
    "token": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "...",
      "name": "Johnathan Miller",
      "email": "patient@medainexus.com",
      "role": "patient"
    }
  }
  ```

### 1.3 Refresh Access Token
- **Method & Route**: `POST /api/auth/refresh`
- **Request Body**: `{ "refreshToken": "..." }` (or in HTTP-only cookie)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
  ```

### 1.4 Get Current User Profile
- **Method & Route**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "patient",
      "profile": { ... }
    }
  }
  ```

---

## 2. Patient Profile (`/api/patients`)

### 2.1 Get Patient Clinical Profile
- **Method & Route**: `GET /api/patients/profile`
- **Headers**: `Authorization: Bearer <token>`

### 2.2 Update Patient Profile
- **Method & Route**: `PUT /api/patients/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "dateOfBirth": "1994-06-15",
    "gender": "male",
    "bloodGroup": "O+",
    "heightCm": 178,
    "weightKg": 72,
    "allergies": ["Penicillin", "Peanuts"],
    "existingConditions": ["Seasonal Rhinitis"],
    "currentMedications": ["Cetirizine 10mg"],
    "emergencyContact": {
      "name": "Eleanor Miller",
      "relationship": "Spouse",
      "phone": "+1-555-0199"
    },
    "city": "New York",
    "dietaryPreference": "non-vegetarian"
  }
  ```

### 2.3 Permanently Delete Account
- **Method & Route**: `DELETE /api/patients/account`
- **Headers**: `Authorization: Bearer <token>`

---

## 3. AI Symptom Analysis (`/api/symptoms`)

### 3.1 Analyze Symptoms
- **Method & Route**: `POST /api/symptoms/analyze`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "symptoms": ["headache", "sensitivity to light", "mild nausea"],
    "duration": "1-3 days",
    "severity": "moderate",
    "frequency": "constant",
    "age": 30
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "result": {
      "id": "...",
      "symptomSummary": "Reported symptoms: headache, sensitivity to light, mild nausea. Duration: 1-3 days...",
      "possibleExplanations": [ ... ],
      "potentialConditions": [
        {
          "condition": "Migraine with or without Aura",
          "probability": "Moderate",
          "explanation": "Characterized by throbbing unilateral or bilateral pain, often sensitive to light and noise."
        }
      ],
      "levelOfConcern": "Moderate",
      "warningSigns": [ "Sudden thunderclap headache", ... ],
      "suggestedSpecialty": "Neurologist",
      "whenToConsultDoctor": "Consult a physician within 24 to 48 hours if symptoms worsen.",
      "isEmergency": false,
      "medicalDisclaimer": "This analysis provides AI-assisted healthcare information..."
    }
  }
  ```

### 3.2 Get Symptom History
- **Method & Route**: `GET /api/symptoms/history`
- **Headers**: `Authorization: Bearer <token>`

---

## 4. Medical Report Analysis (`/api/reports`)

### 4.1 Upload & Analyze Report Document
- **Method & Route**: `POST /api/reports/upload`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data**:
  - `reportFile`: Binary file (`.pdf`, `.jpg`, `.jpeg`, `.png`)
  - `title`: String
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Medical report uploaded and analyzed successfully.",
    "report": { ... },
    "extractedValues": [
      {
        "parameter": "Hemoglobin",
        "value": "14.5",
        "unit": "g/dL",
        "referenceRange": "13.5 - 17.5 g/dL",
        "status": "Normal",
        "explanation": "Protein in red blood cells that carries oxygen throughout your body."
      }
    ]
  }
  ```

### 4.2 Get Report Details
- **Method & Route**: `GET /api/reports/:id`
- **Headers**: `Authorization: Bearer <token>`

---

## 5. AI Prescription Scanner (`/api/prescriptions`)

### 5.1 Upload & Scan Prescription
- **Method & Route**: `POST /api/prescriptions/upload`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data**:
  - `prescriptionFile`: (Optional file upload)
  - `rawText`: (Optional text input)
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Prescription scanned and medicines scheduled.",
    "prescription": { ... },
    "medicines": [
      {
        "medicineName": "Amoxicillin Trihydrate",
        "brandName": "Augmentin Duo",
        "strength": "625mg",
        "dosage": "1 tablet",
        "frequency": "Twice daily",
        "duration": "5 days",
        "beforeAfterFood": "After food",
        "confidenceFlag": "Verified High Confidence"
      }
    ]
  }
  ```

### 5.2 Get Medication Reminders
- **Method & Route**: `GET /api/prescriptions/reminders`
- **Headers**: `Authorization: Bearer <token>`

### 5.3 Mark Medication Taken or Skipped
- **Method & Route**: `PUT /api/prescriptions/reminders/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "status": "taken" }` // "taken" | "skipped" | "pending"

---

## 6. AI Personalized Diet Planner (`/api/diet`)

### 6.1 Generate 7-Day Precision Meal Plan
- **Method & Route**: `POST /api/diet/generate`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "healthGoals": ["Weight management"],
    "dietaryPreference": "vegetarian",
    "activityLevel": "moderate",
    "allergies": ["Peanuts"]
  }
  ```

### 6.2 Log Daily Water & Caloric Nutrition
- **Method & Route**: `POST /api/diet/nutrition-log`
- **Request Body**:
  ```json
  {
    "waterIntakeMl": 1750,
    "caloriesConsumed": 1950
  }
  ```

---

## 7. Doctor Recommendation & Appointments (`/api/doctors`, `/api/appointments`)

### 7.1 Search Verified Doctors
- **Method & Route**: `GET /api/doctors`
- **Query Parameters**:
  - `specialty`: e.g. "Cardiologist"
  - `city`: e.g. "New York"
  - `maxFee`: e.g. "80"
  - `symptomQuery`: e.g. "persistent heart palpitations" (triggers AI specialty recommendation)

### 7.2 Book Appointment
- **Method & Route**: `POST /api/appointments`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "doctorId": "...",
    "appointmentDate": "2026-11-20",
    "timeSlot": "10:30 AM",
    "consultationType": "online", // "online" | "offline"
    "reasonForVisit": "Cardiovascular screening"
  }
  ```

---

## 8. AI Conversational Health Assistant (`/api/chat`)

### 8.1 Send Message
- **Method & Route**: `POST /api/chat/message`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "conversationId": null, // or string
    "message": "Can you explain what my elevated cholesterol in my latest report means?",
    "contextAllowed": true
  }
  ```

---

## 9. Dashboard Overview (`/api/dashboard`)

### 9.1 Get Overview
- **Method & Route**: `GET /api/dashboard/overview`
- **Headers**: `Authorization: Bearer <token>`
- **Returns**: Aggregated metrics, unread notifications, upcoming visits, vital metrics for Recharts charts.

---

## 10. Privacy & Security (`/api/privacy`)

### 10.1 Consent Preferences
- **Method & Route**: `GET /api/privacy/consents` & `PUT /api/privacy/consents`

### 10.2 DSAR Personal Data Archive Export
- **Method & Route**: `GET /api/privacy/export-data`
- **Returns**: Full JSON download of patient medical history.
