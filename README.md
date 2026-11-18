# MedAI Nexus — AI-Powered Smart Healthcare Management Platform

![MedAI Nexus Platform](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200)

**MedAI Nexus** is a production-oriented, full-stack, AI-powered healthcare management platform built strictly with the **MERN Stack** (MongoDB, Express.js, React.js with Vite, and Node.js in 100% JavaScript).

---

## 🏥 The 10 Integrated Clinical Modules

1. **Authentication & User Management**: Role-based access control (`Patient`, `Doctor`, `Admin`), secure password hashing (`bcrypt`), JWT access & refresh tokens, profile management, OTP verification, and account lifecycle.
2. **AI Symptom Analysis**: Searchable symptom input, severity, duration, and clinical context collection. Non-diagnostic possibility reports, warning signs, recommended medical specialties, and emergency red-flag triage.
3. **Medical Report OCR & Lab Extraction**: PDF, JPG, and PNG diagnostic report scanning with parameter identification (Hemoglobin, Glucose, Cholesterol, Creatinine, etc.), reference range comparison, status indicators (`Normal`, `Above`, `Below`), and plain-language clinical interpretations.
4. **AI Prescription Scanner**: Prescription extraction, drug dosage parsing, frequency, duration, food instructions, pharmacist verification flags, and an interactive daily medication schedule with mark-as-taken tracking.
5. **AI Personalized Diet Planner**: Precision 7-day culinary nutritional plan respecting allergies, medical conditions, and macro targets (calories, protein, carbs, fats) with a built-in hydration tracker and grocery checklist.
6. **AI Doctor Recommendation System**: Verified specialist directory filtered by specialty, location, consultation fee, and rating, with AI keyword-based specialty matching.
7. **Appointment Booking System**: Atomic double-booking prevention, calendar slot scheduling, consultation modes (`Online Telehealth` / `In-Person Clinic`), status transitions, and doctor management.
8. **AI Conversational Health Assistant**: ChatGPT-style conversational assistant with authorized patient health context integration (allergies, conditions, lab tests), emergency detection, and medical disclaimers.
9. **Personalized Health Dashboard**: Comprehensive patient overview with interactive Recharts visualizations (Weight history, Blood Pressure, Blood Glucose), vital logging, and medication checklists.
10. **Safety, Security & Privacy**: Granular patient consent management, security audit logging, DSAR personal data archive export, input validation, rate limiting, and regulatory compliance alignment (DPDP & HIPAA).

Plus:
- **Specialist Clinical Portal**: Doctor appointments queue, patient consultation status, and telehealth video room links.
- **Platform Administration Center**: Real-time platform telemetry, user management, physician verification toggle, and audit trails.

---

## 🛠️ Technology Stack (Strictly MERN)

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React.js (Vite), JavaScript (ESM), Tailwind CSS, React Router DOM, Axios, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, REST APIs, JSON Web Tokens (JWT), Cookie Parser, Helmet, Express Rate Limit, Multer |
| **Database** | MongoDB, Mongoose ODM, MongoDB Atlas / Local MongoDB, Autonomous Development Fallback Store |
| **AI / OCR** | Google Gemini 2.5 Flash (`gemini-2.5-flash`) & Clinical Intelligence Engine |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- NPM (v9+)
- MongoDB Atlas URI or local MongoDB (optional: resilient in-memory development engine is active by default)

### 2. Setup & Installation

```bash
# Clone the repository
git clone <repo-url>
cd MediAI_Nexus_Project

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 3. Environment Configuration

```bash
# Copy sample environment configuration
cp .env.example server/.env
```

### 4. Running Locally

```bash
# Terminal 1: Launch Backend API (Port 5000)
cd server
npm start

# Terminal 2: Launch Frontend Client (Port 5173)
cd client
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Configured Demo Credentials

For quick evaluation, MedAI Nexus automatically seeds baseline verified accounts on initial launch:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@medainexus.com` | `Patient@123` | Patient Dashboard, Symptom Checker, Lab Reports, Prescriptions, Appointments |
| **Doctor** | `doctor@medainexus.com` | `Doctor@123` | Specialist Clinical Portal, Consultation Queue, Availability |
| **Admin** | `admin@medainexus.com` | `Admin@123` | Platform Administration, Doctor Verification, Audit Logs |

---

## 🧪 Automated Testing

Run the automated backend test suite:

```bash
node server/tests/runTests.js
```

**Results: 8/8 Tests Passing (100%)**
- ✅ JWT Access Token Generation & Decryption
- ✅ Bcrypt Password Hashing & Comparison
- ✅ AI Symptom Analysis — Upper Respiratory
- ✅ AI Symptom Analysis — Emergency Triage Escalation
- ✅ Medical Report Analysis — Parameter Extraction & Flagging
- ✅ Prescription Scanner — Drug Extraction & Food Instructions
- ✅ AI Diet Planner — 7-Day Caloric & Macro Calculation
- ✅ Doctor Recommendation AI — Specialty Keyword Matching

---

## 🐳 Docker Deployment

To launch the full platform using Docker Compose:

```bash
docker-compose up --build -d
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`

---

## 🛡️ Medical Disclaimer
> "This application provides AI-assisted healthcare information and educational guidance. It does not replace professional medical diagnosis or treatment. AI-generated information may be inaccurate or incomplete. Always consult a qualified healthcare professional for medical decisions. In a life-threatening emergency, call 911 immediately."
