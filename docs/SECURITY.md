# MedAI Nexus — Security, Privacy & Compliance Architecture

This document describes the security and data protection measures implemented across the **MedAI Nexus** Smart Healthcare Management Platform.

---

## 1. Authentication & Session Security

- **Password Hashing**: User passwords are encrypted using `bcryptjs` with salt rounds set to `10`. Plaintext passwords are never stored or logged.
- **JSON Web Tokens (JWT)**:
  - Short-lived Access Tokens (1 hour expiry) for stateless request authorization.
  - Refresh Tokens (7 days expiry) stored in HTTP-Only, Secure, SameSite cookies with database session verification.
- **Brute-Force & Denial-of-Service Protection**:
  - `express-rate-limit` is enforced across all sensitive authentication endpoints (maximum 30 attempts per 15-minute window).
  - API rate limiting is enforced across all AI analysis and document processing endpoints (maximum 20 requests per minute).
- **Role-Based Access Control (RBAC)**:
  - Three distinct privilege tiers: `patient`, `doctor`, `admin`.
  - Strict middleware guards (`authorize('admin')`, `authorize('doctor')`) prevent horizontal and vertical privilege escalation.

---

## 2. Patient Data Isolation & Privacy

- **Cross-Patient Access Isolation**:
  - All clinical queries (`medicalReports`, `prescriptions`, `symptomRecords`, `dietPlans`, `appointments`) explicitly verify that `req.user.id` matches the document's `user` ObjectId.
  - Patients cannot query or modify another patient's medical records.
- **Explicit Consent Management**:
  - Granular patient consent records are tracked in the `consentRecords` collection for:
    1. Medical Data Processing
    2. AI Assisted Diagnostic Analysis
    3. Notifications & Telehealth Communications
    4. Virtual Telehealth Consultation Terms
  - Consent can be granted or revoked by the patient at any time via the Privacy & Security Center.
- **Data Portability (DSAR)**:
  - Compliant with Data Subject Access Request (DSAR) requirements under DPDP / GDPR.
  - Patients can export their complete medical record history as a machine-readable JSON archive at any time.

---

## 3. Network & Application Layer Hardening

- **Helmet Security Headers**:
  - Configures standard HTTP headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
- **Cross-Origin Resource Sharing (CORS)**:
  - Explicitly restricts allowed origins to authorized client domains.
- **Input Validation & Sanitization**:
  - Validates all request parameters, data types, and file uploads.
  - Multer upload limits enforce a 15MB file ceiling and restrict file types strictly to `application/pdf`, `image/jpeg`, `image/jpg`, and `image/png`.

---

## 4. Immutable Audit Logging

Every critical system action is recorded in the `auditLogs` collection:
- `USER_REGISTERED`
- `LOGIN_SUCCESS` / `LOGIN_FAILED`
- `SYMPTOMS_ANALYZED`
- `REPORT_UPLOADED_AND_ANALYZED`
- `PRESCRIPTION_SCANNED`
- `APPOINTMENT_BOOKED` / `APPOINTMENT_CANCELLED`
- `PRIVACY_CONSENT_MODIFIED`
- `PERSONAL_DATA_EXPORTED`
- `ACCOUNT_DELETED`

Each audit entry logs the acting user, resource target, IP address, user agent, and timestamp.

---

## 5. Medical Safety & Clinical Disclaimers

### Non-Diagnostic AI Principle
MedAI Nexus is an **educational and assistive healthcare triage platform**. It does **NOT** provide definitive medical diagnoses, initiate prescriptions, or replace clinical consultation with a licensed physician.

### Life-Threatening Emergency Detection
If user-entered symptoms contain red-flag emergency keywords (such as crushing chest pain, severe shortness of breath, sudden numbness, or facial drooping), the AI triage engine immediately flags the assessment as **Emergency** and directs the patient to call emergency services (911) rather than continuing standard AI guidance.

### Mandatory Medical Disclaimer
> "This application provides AI-assisted healthcare information and educational guidance. It does not replace professional medical diagnosis or treatment. AI-generated information may be inaccurate or incomplete. Always consult a qualified healthcare professional for medical decisions."
