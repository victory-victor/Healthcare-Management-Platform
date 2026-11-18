const mongoose = require('mongoose');

const prescriptionMedicineSchema = new mongoose.Schema(
  {
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    medicineName: {
      type: String,
      required: true
    },
    brandName: {
      type: String,
      default: ''
    },
    strength: {
      type: String,
      default: '500mg'
    },
    dosage: {
      type: String,
      default: '1 tablet'
    },
    frequency: {
      type: String,
      default: 'Twice daily'
    },
    duration: {
      type: String,
      default: '5 days'
    },
    instructions: {
      type: String,
      default: 'Take with warm water'
    },
    beforeAfterFood: {
      type: String,
      enum: ['After food', 'Before food', 'With food', 'As needed', 'Unspecified'],
      default: 'After food'
    },
    confidenceFlag: {
      type: String,
      enum: ['Verified High Confidence', 'Needs Pharmacist/Doctor Review'],
      default: 'Verified High Confidence'
    },
    isRemindersEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

prescriptionMedicineSchema.index({ prescription: 1 });
prescriptionMedicineSchema.index({ user: 1 });

module.exports = mongoose.model('PrescriptionMedicine', prescriptionMedicineSchema);
