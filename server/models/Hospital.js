const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      default: 'NY'
    },
    phone: {
      type: String,
      default: '+1-555-0199'
    },
    email: {
      type: String,
      default: 'contact@hospital.org'
    },
    rating: {
      type: Number,
      default: 4.7
    },
    emergencyAvailable: {
      type: Boolean,
      default: true
    },
    latitude: {
      type: Number,
      default: 40.7128
    },
    longitude: {
      type: Number,
      default: -74.0060
    }
  },
  {
    timestamps: true
  }
);

hospitalSchema.index({ city: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
