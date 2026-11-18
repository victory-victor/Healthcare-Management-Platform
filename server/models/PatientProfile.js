const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say'
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown'
    },
    heightCm: {
      type: Number,
      default: 170
    },
    weightKg: {
      type: Number,
      default: 68
    },
    allergies: {
      type: [String],
      default: []
    },
    existingConditions: {
      type: [String],
      default: []
    },
    currentMedications: {
      type: [String],
      default: []
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: 'New York'
    },
    state: {
      type: String,
      default: 'NY'
    },
    country: {
      type: String,
      default: 'USA'
    },
    dietaryPreference: {
      type: String,
      enum: ['vegetarian', 'vegan', 'non-vegetarian', 'eggetarian', 'jain', 'custom'],
      default: 'non-vegetarian'
    },
    healthGoals: {
      type: [String],
      default: ['General healthy eating', 'Weight management']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
