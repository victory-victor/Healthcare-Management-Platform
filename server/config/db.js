const mongoose = require('mongoose');

let isConnected = false;
let isDevMemoryMode = false;

// In-memory fallback collections for zero-downtime local development
const memoryStorage = {
  users: [],
  patientprofiles: [],
  doctorprofiles: [],
  hospitals: [],
  specialties: [],
  doctoravailabilities: [],
  appointments: [],
  symptomrecords: [],
  symptomanalysisresults: [],
  medicalreports: [],
  extractedmedicalvalues: [],
  prescriptions: [],
  prescriptionmedicines: [],
  medicationreminders: [],
  dietplans: [],
  dietmeals: [],
  nutritionrecords: [],
  healthmetrics: [],
  chatconversations: [],
  chatmessages: [],
  notifications: [],
  consentrecords: [],
  auditlogs: [],
  usersessions: []
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medai_nexus';

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    isDevMemoryMode = false;
    console.log(`[MedAI Nexus] MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    const reason = error.message.replace(/mongodb(\+srv)?:\/\/[^\s@]+@/gi, 'mongodb$1://<redacted>@');
    console.warn(`[MedAI Nexus] MongoDB connection failed (${error.name}): ${reason}`);
    console.log(`[MedAI Nexus] Activating Autonomous Resilient Development Engine (Local In-Memory Persistence Mode).`);
    console.log(`[MedAI Nexus] Check MONGODB_URI, Atlas network access, and database credentials.`);
    isConnected = false;
    isDevMemoryMode = true;
  }
};

module.exports = {
  connectDB,
  isConnected: () => isConnected,
  isDevMemoryMode: () => isDevMemoryMode,
  memoryStorage
};
