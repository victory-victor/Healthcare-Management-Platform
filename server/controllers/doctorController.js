const dbAdapter = require('../services/dbAdapter');
const { recommendSpecialty } = require('../ai/doctorRecommendationAI');

// @desc    Get all doctors with filtering and AI recommendation
// @route   GET /api/doctors
exports.getDoctors = async (req, res, next) => {
  try {
    const { specialty, city, maxFee, search, symptomQuery } = req.query;

    let filter = {};
    if (specialty && specialty !== 'all') {
      filter.specialty = specialty;
    }
    if (city && city !== 'all') {
      filter.city = { $regex: city, $options: 'i' };
    }

    let doctors = await dbAdapter.find('DoctorProfile', filter);

    if (search) {
      const s = search.toLowerCase();
      doctors = doctors.filter(doc =>
        doc.fullName?.toLowerCase().includes(s) ||
        doc.specialty?.toLowerCase().includes(s) ||
        doc.hospital?.toLowerCase().includes(s)
      );
    }

    if (maxFee) {
      doctors = doctors.filter(doc => doc.consultationFees <= Number(maxFee));
    }

    // If patient asked for AI recommendation based on symptom query
    let aiRecommendation = null;
    if (symptomQuery) {
      aiRecommendation = recommendSpecialty(symptomQuery);
    }

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
      aiRecommendation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor by ID
// @route   GET /api/doctors/:id
exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await dbAdapter.findById('DoctorProfile', req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const availability = await dbAdapter.find('DoctorAvailability', { doctor: req.params.id });

    res.status(200).json({
      success: true,
      doctor,
      availability
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of medical specialties
// @route   GET /api/doctors/specialties
exports.getSpecialties = async (req, res, next) => {
  try {
    const specialties = await dbAdapter.find('Specialty', { isActive: true });
    res.status(200).json({
      success: true,
      count: specialties.length,
      specialties
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor availability slots
// @route   GET /api/doctors/:id/availability
exports.getAvailability = async (req, res, next) => {
  try {
    const slots = await dbAdapter.find('DoctorAvailability', { doctor: req.params.id });
    res.status(200).json({
      success: true,
      slots
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor Dashboard metrics & upcoming bookings
// @route   GET /api/doctors/dashboard/overview
exports.getDoctorDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const doctor = await dbAdapter.findOne('DoctorProfile', { user: userId });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const appointments = await dbAdapter.find('Appointment', { doctor: doctor._id || doctor.id }, { appointmentDate: 1 });
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
    const completedCount = appointments.filter(a => a.status === 'completed').length;

    // Populate patient basic details for upcoming appointments
    const populatedAppointments = [];
    for (const appt of appointments) {
      const patientUser = await dbAdapter.findById('User', appt.patient);
      const patientProfile = await dbAdapter.findOne('PatientProfile', { user: appt.patient });
      populatedAppointments.push({
        ...appt,
        patientName: patientUser?.name || 'Patient',
        patientEmail: patientUser?.email || '',
        patientPhone: patientUser?.phone || '',
        patientDetails: patientProfile || null
      });
    }

    res.status(200).json({
      success: true,
      doctor,
      metrics: {
        totalAppointments: appointments.length,
        pendingCount,
        confirmedCount,
        completedCount
      },
      recentAppointments: populatedAppointments.slice(0, 20)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patients linked to the logged-in doctor
// @route   GET /api/doctors/dashboard/patients
exports.getDoctorPatients = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const doctor = await dbAdapter.findOne('DoctorProfile', { user: userId });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const appointments = await dbAdapter.find('Appointment', { doctor: doctor._id || doctor.id });
    let patientIds = [...new Set(appointments.map(a => String(a.patient)).filter(Boolean))];

    // If doctor has no appointments yet, show registered patients so doctor can review dossiers & prescribe
    if (patientIds.length === 0) {
      const allPatients = await dbAdapter.find('User', { role: 'patient' });
      patientIds = allPatients.map(u => String(u._id || u.id));
    }

    const patients = [];
    for (const pId of patientIds) {
      const u = await dbAdapter.findById('User', pId);
      const profile = await dbAdapter.findOne('PatientProfile', { user: pId });
      const rawReports = await dbAdapter.find('MedicalReport', { user: pId }, { createdAt: -1 });

      const populatedReports = [];
      for (const r of rawReports) {
        const vals = await dbAdapter.find('ExtractedMedicalValue', { report: r._id || r.id });
        populatedReports.push({
          ...r,
          extractedValues: vals || []
        });
      }

      const appts = appointments.filter(a => String(a.patient) === String(pId));

      patients.push({
        id: pId,
        _id: pId,
        name: u?.name || 'Patient',
        email: u?.email || '',
        phone: u?.phone || '',
        profile: profile || null,
        reports: populatedReports,
        totalVisits: appts.length,
        lastVisit: appts[0]?.appointmentDate || null
      });
    }

    res.status(200).json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Doctor Practice Profile
// @route   PUT /api/doctors/dashboard/profile
exports.updateDoctorProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const doctor = await dbAdapter.findOne('DoctorProfile', { user: userId });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const {
      fullName,
      specialty,
      qualifications,
      experienceYears,
      registrationNumber,
      hospital,
      consultationFees,
      city,
      bio,
      availableSlots
    } = req.body;

    const updated = await dbAdapter.findByIdAndUpdate('DoctorProfile', doctor._id || doctor.id, {
      ...(fullName && { fullName }),
      ...(specialty && { specialty }),
      ...(qualifications && { qualifications }),
      ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) }),
      ...(registrationNumber && { registrationNumber }),
      ...(hospital && { hospital }),
      ...(consultationFees !== undefined && { consultationFees: Number(consultationFees) }),
      ...(city && { city }),
      ...(bio !== undefined && { bio }),
      ...(availableSlots && { availableSlots })
    });

    if (fullName) {
      await dbAdapter.findByIdAndUpdate('User', userId, { name: fullName });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully.',
      doctor: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Doctor Availability Slots & Working Schedule
// @route   PUT /api/doctors/dashboard/availability
exports.updateDoctorAvailability = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const doctor = await dbAdapter.findOne('DoctorProfile', { user: userId });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const { availableSlots, workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] } = req.body;

    if (availableSlots && Array.isArray(availableSlots)) {
      await dbAdapter.findByIdAndUpdate('DoctorProfile', doctor._id || doctor.id, {
        availableSlots
      });

      for (const day of workingDays) {
        const existing = await dbAdapter.findOne('DoctorAvailability', {
          doctor: doctor._id || doctor.id,
          dayOfWeek: day
        });

        if (existing) {
          await dbAdapter.findByIdAndUpdate('DoctorAvailability', existing._id || existing.id, {
            slots: availableSlots,
            isAvailable: true
          });
        } else {
          await dbAdapter.create('DoctorAvailability', {
            doctor: doctor._id || doctor.id,
            dayOfWeek: day,
            slots: availableSlots,
            isAvailable: true
          });
        }
      }
    }

    const updatedDoctor = await dbAdapter.findById('DoctorProfile', doctor._id || doctor.id);

    res.status(200).json({
      success: true,
      message: 'Consultation availability updated successfully.',
      doctor: updatedDoctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue Digital Prescription to Patient
// @route   POST /api/doctors/dashboard/prescribe
exports.issuePrescription = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const doctor = await dbAdapter.findOne('DoctorProfile', { user: userId });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const {
      patientId,
      appointmentId,
      diagnosis = 'Clinical Consultation',
      medicines = [],
      clinicalNotes = '',
      followUpDate = null
    } = req.body;

    if (!patientId || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one medication are required.' });
    }

    const patientUser = await dbAdapter.findById('User', patientId);
    if (!patientUser) {
      return res.status(404).json({ success: false, message: 'Patient account not found.' });
    }

    // 1. Create Prescription Record
    const prescription = await dbAdapter.create('Prescription', {
      user: patientId,
      title: `Rx: ${diagnosis} (by Dr. ${doctor.fullName})`,
      originalFilename: `Digital_Prescription_${Date.now()}.pdf`,
      storedFilename: `digital_rx_${Date.now()}`,
      filePath: 'digital://in-app-rx',
      prescribingDoctor: doctor.fullName,
      prescriptionDate: new Date(),
      status: 'verified',
      notes: clinicalNotes || `Prescribed by ${doctor.fullName} (${doctor.specialty}). Follow-up: ${followUpDate || 'As needed'}.`
    });

    // 2. Create Prescription Medicines & Schedule Daily Reminders
    const createdMeds = [];
    for (const med of medicines) {
      const medicineDoc = await dbAdapter.create('PrescriptionMedicine', {
        prescription: prescription._id || prescription.id,
        user: patientId,
        medicineName: med.medicineName,
        dosage: med.dosage || '1 tablet',
        frequency: med.frequency || 'Once daily',
        duration: med.duration || '5 days',
        instructions: med.instructions || 'Take after meals'
      });
      createdMeds.push(medicineDoc);

      // Auto-schedule medication reminder for patient
      await dbAdapter.create('MedicationReminder', {
        medicine: medicineDoc._id || medicineDoc.id,
        user: patientId,
        medicineName: med.medicineName,
        dosage: med.dosage || '1 tablet',
        timeOfDay: '09:00 AM',
        isActive: true,
        statusToday: 'pending'
      });
    }

    // 3. If tied to an appointment, complete it and record notes
    if (appointmentId) {
      await dbAdapter.findByIdAndUpdate('Appointment', appointmentId, {
        status: 'completed',
        doctorNotes: `Diagnosis: ${diagnosis}. Prescribed ${medicines.length} medications.`
      });
    }

    // 4. Send in-app notification to patient
    await dbAdapter.create('Notification', {
      user: patientId,
      title: 'Digital Prescription Received',
      message: `${doctor.fullName} has issued your official digital prescription for ${diagnosis}. Check your medicine reminders.`,
      type: 'medication',
      referenceId: prescription._id || prescription.id
    });

    res.status(201).json({
      success: true,
      message: 'Digital prescription issued and synced to patient medical record successfully.',
      prescription,
      medicines: createdMeds
    });
  } catch (error) {
    next(error);
  }
};
