const dbAdapter = require('../services/dbAdapter');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Book a new doctor appointment with double-booking validation
// @route   POST /api/appointments
exports.bookAppointment = async (req, res, next) => {
  try {
    const patientId = req.user._id || req.user.id;
    const {
      doctorId,
      appointmentDate,
      timeSlot,
      consultationType = 'online',
      reasonForVisit = 'Consultation',
      symptomsDescription = ''
    } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Doctor, appointment date, and time slot are required.' });
    }

    const doctor = await dbAdapter.findById('DoctorProfile', doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Atomic server-side validation against double-booking
    const bookingDateStr = new Date(appointmentDate).toISOString().split('T')[0];
    const existingAppointments = await dbAdapter.find('Appointment', {
      doctor: doctorId,
      timeSlot,
      status: { $in: ['confirmed', 'pending'] }
    });

    const isSlotTaken = existingAppointments.some(appt => {
      const apptDateStr = new Date(appt.appointmentDate).toISOString().split('T')[0];
      return apptDateStr === bookingDateStr;
    });

    if (isSlotTaken) {
      return res.status(409).json({
        success: false,
        message: `This time slot (${timeSlot}) is already booked for ${bookingDateStr}. Please choose an alternative slot.`
      });
    }

    const newAppointment = await dbAdapter.create('Appointment', {
      patient: patientId,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      consultationType,
      status: 'confirmed',
      reasonForVisit,
      symptomsDescription,
      meetingLink: consultationType === 'online' ? `https://telehealth.medainexus.com/room/${Date.now().toString(36)}` : null
    });

    // In-app notification for patient
    await dbAdapter.create('Notification', {
      user: patientId,
      title: 'Appointment Confirmed',
      message: `Your ${consultationType} appointment with ${doctor.fullName} on ${bookingDateStr} at ${timeSlot} is confirmed.`,
      type: 'appointment',
      referenceId: newAppointment._id || newAppointment.id
    });

    logAudit(req, 'APPOINTMENT_BOOKED', 'Appointment', newAppointment._id || newAppointment.id, {
      doctorId,
      date: bookingDateStr,
      timeSlot
    });

    res.status(201).json({
      success: true,
      message: 'Appointment successfully confirmed.',
      appointment: {
        ...newAppointment,
        doctor
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user appointments (or doctor's appointments if user is a doctor)
// @route   GET /api/appointments
exports.getAppointments = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let appointments = [];

    if (req.user.role === 'doctor') {
      const doctorProfile = await dbAdapter.findOne('DoctorProfile', { user: userId });
      if (doctorProfile) {
        appointments = await dbAdapter.find('Appointment', { doctor: doctorProfile._id || doctorProfile.id }, { appointmentDate: -1 });
      }
    } else {
      appointments = await dbAdapter.find('Appointment', { patient: userId }, { appointmentDate: -1 });
    }

    // Populate doctor details
    const populated = [];
    for (const appt of appointments) {
      const doctor = await dbAdapter.findById('DoctorProfile', appt.doctor);
      const patient = await dbAdapter.findById('User', appt.patient);
      populated.push({
        ...appt,
        doctor: doctor || { fullName: 'Medical Specialist', specialty: 'General Practice' },
        patient: patient ? { name: patient.name, email: patient.email, phone: patient.phone } : null
      });
    }

    res.status(200).json({
      success: true,
      count: populated.length,
      appointments: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status (confirm, complete, cancel, reschedule)
// @route   PUT /api/appointments/:id
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, doctorNotes, cancellationReason, appointmentDate, timeSlot } = req.body;
    const appointment = await dbAdapter.findById('Appointment', req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const updated = await dbAdapter.findByIdAndUpdate('Appointment', req.params.id, {
      ...(status && { status }),
      ...(doctorNotes && { doctorNotes }),
      ...(cancellationReason && { cancellationReason }),
      ...(appointmentDate && { appointmentDate: new Date(appointmentDate) }),
      ...(timeSlot && { timeSlot })
    });

    logAudit(req, 'APPOINTMENT_UPDATED', 'Appointment', req.params.id, { status });

    res.status(200).json({
      success: true,
      message: `Appointment updated to status: ${status || 'updated'}.`,
      appointment: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await dbAdapter.findById('Appointment', req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const updated = await dbAdapter.findByIdAndUpdate('Appointment', req.params.id, {
      status: 'cancelled',
      cancellationReason: req.body.reason || 'Cancelled by patient'
    });

    logAudit(req, 'APPOINTMENT_CANCELLED', 'Appointment', req.params.id);

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled.',
      appointment: updated
    });
  } catch (error) {
    next(error);
  }
};
