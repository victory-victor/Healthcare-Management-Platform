const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      required: true
    },
    consultationType: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
      default: 'confirmed'
    },
    reasonForVisit: {
      type: String,
      default: 'General Consultation'
    },
    symptomsDescription: {
      type: String,
      default: ''
    },
    doctorNotes: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: null
    },
    meetingLink: {
      type: String,
      default: 'https://meet.medainexus.com/consult-room'
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1, timeSlot: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
