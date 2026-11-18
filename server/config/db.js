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
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    isDevMemoryMode = false;
    console.log(`[MedAI Nexus] MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MedAI Nexus] Notice: MongoDB not reachable at ${mongoUri}.`);
    console.log(`[MedAI Nexus] Activating Autonomous Resilient Development Engine (Local In-Memory Persistence Mode).`);
    console.log(`[MedAI Nexus] Tip: Set MONGODB_URI in server/.env with your MongoDB Atlas connection string when ready for cloud storage.`);
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
