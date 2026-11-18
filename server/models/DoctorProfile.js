const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    fullName: {
      type: String,
      required: true
    },
    specialty: {
      type: String,
      required: true,
      default: 'General Physician'
    },
    qualifications: {
      type: String,
      default: 'MBBS, MD'
    },
    experienceYears: {
      type: Number,
      default: 5
    },
    registrationNumber: {
      type: String,
      required: true,
      default: 'MED-REG-10924'
    },
    hospital: {
      type: String,
      default: 'Metro Health Hospital'
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null
    },
    consultationFees: {
      type: Number,
      default: 50
    },
    address: {
      type: String,
      default: '124 Medical Center Way'
    },
    city: {
      type: String,
      default: 'New York'
    },
    bio: {
      type: String,
      default: 'Board-certified specialist dedicated to evidence-based, compassionate patient care.'
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 4.8
    },
    reviewsCount: {
      type: Number,
      default: 34
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    availableSlots: {
      type: [String],
      default: ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM']
    },
    consultationTypes: {
      type: [String],
      default: ['online', 'offline']
    }
  },
  {
    timestamps: true
  }
);

doctorProfileSchema.index({ specialty: 1 });
doctorProfileSchema.index({ city: 1 });
doctorProfileSchema.index({ isVerified: 1 });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
