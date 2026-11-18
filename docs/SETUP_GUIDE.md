# MedAI Nexus — Setup & Installation Guide

Welcome to **MedAI Nexus**, an AI-powered Smart Healthcare Management Platform built on the **MERN Stack** (MongoDB, Express.js, React.js with Vite, and Node.js in JavaScript).

---

## 1. System Requirements

- **Node.js**: v18.0.0 or higher (Tested on Node v20.17.0)
- **NPM**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas connection string (or local MongoDB daemon `mongodb://localhost:27017/medai_nexus`). If MongoDB is not yet running locally, the application features an **Autonomous Resilient Development Mode** that allows all endpoints and features to run out-of-the-box.

---

## 2. Quick Start (Zero-Friction Local Execution)

### Step 1: Install Dependencies

From the project root:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Return to root
cd ..
```

### Step 2: Configure Environment Variables

The repository includes a ready-to-run `.env.example`.
Copy it to `server/.env`:

```bash
cp .env.example server/.env
```

Key environment configuration variables:
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection (MongoDB Atlas or Local MongoDB)
MONGODB_URI=mongodb://localhost:27017/medai_nexus

# Security Secrets
JWT_ACCESS_SECRET=medai_nexus_jwt_access_secret_production_key_38749281
JWT_REFRESH_SECRET=medai_nexus_jwt_refresh_secret_production_key_91827364

# AI Integration (Google Gemini 2.5 Flash)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
AI_DEV_MODE=false
```

### Step 3: Run the Application

You can start the backend and frontend simultaneously:

```bash
# Terminal 1: Start Backend Server (port 5000)
cd server
npm start

# Terminal 2: Start Frontend Client (port 5173)
cd client
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 3. Pre-Seeded Clinical Accounts

Upon first launch, the server automatically populates sample verified clinical directories and demo credentials:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@medainexus.com` | `Patient@123` | Patient Health Dashboard, Symptoms, Reports, Prescriptions, Diet, Appointments |
| **Doctor** | `doctor@medainexus.com` | `Doctor@123` | Specialist Clinical Portal, Patient Booking Management, Telehealth Rooms |
| **Admin** | `admin@medainexus.com` | `Admin@123` | Platform Telemetry, Doctor Verification, Specialty Management, Security Audit Trails |

*Note: You can also register a new Patient or Doctor account directly on the registration page.*

---

## 4. Running the Automated Test Suite

To run the backend integration tests, execute:

```bash
node server/tests/runTests.js
```

Test Coverage Includes:
- JWT Access Token generation & verification
- Bcrypt password hashing & comparison
- AI Symptom Analysis (Upper respiratory & clinical matching)
- AI Emergency Triage Escalation (911 red-flag detection)
- Medical Report Parameter Extraction & Reference Range Flagging
- Prescription OCR Extraction & Drug Schedule
- AI Diet Planner 7-day Calorie & Macro Calculation
- Doctor Recommendation AI Keyword Matching

---

## 5. Production Build

To build the React application for production deployment:

```bash
cd client
npm run build
```

The compiled assets will be created in `client/dist/`.

---

## 6. Containerized Deployment (Docker Compose)

To launch the entire platform container stack (MongoDB 7.0, Express Node.js Server, and Nginx-powered React Client):

```bash
docker-compose up --build -d
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **MongoDB Database**: `mongodb://localhost:27017/medai_nexus`
- **Health Check**: `http://localhost:5000/api/health`

