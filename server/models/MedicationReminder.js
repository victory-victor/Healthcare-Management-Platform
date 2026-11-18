const mongoose = require('mongoose');

const medicationReminderSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrescriptionMedicine',
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
    dosage: {
      type: String,
      default: '1 tablet'
    },
    timeOfDay: {
      type: String,
      required: true,
      default: '08:00 AM'
    },
    daysOfWeek: {
      type: [String],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    statusToday: {
      type: String,
      enum: ['pending', 'taken', 'skipped'],
      default: 'pending'
    },
    lastTakenAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

medicationReminderSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('MedicationReminder', medicationReminderSchema);
