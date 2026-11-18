const bcrypt = require('bcryptjs');
const dbAdapter = require('../services/dbAdapter');

const seedInitialData = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const doctorPassword = await bcrypt.hash('Doctor@123', salt);
    const patientPassword = await bcrypt.hash('Patient@123', salt);

    // 1. Ensure Default Admin
    const existingAdmin = await dbAdapter.findOne('User', { email: 'admin@medainexus.com' }, '+password');
    if (!existingAdmin) {
      await dbAdapter.create('User', {
        name: 'System Administrator',
        email: 'admin@medainexus.com',
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true
      });
    } else if (!existingAdmin.password) {
      await dbAdapter.findByIdAndUpdate('User', existingAdmin._id || existingAdmin.id, { password: adminPassword });
    }

    // 2. Ensure Hospitals
    const hospitalCount = await dbAdapter.countDocuments('Hospital');
    if (hospitalCount === 0) {
      const hospitals = [
        { name: 'Mount Sinai Medical Center', address: '1468 Madison Ave', city: 'New York', state: 'NY', phone: '+1-212-241-6500', rating: 4.9 },
        { name: 'Johns Hopkins Health Pavilion', address: '600 N Wolfe St', city: 'Baltimore', state: 'MD', phone: '+1-410-955-5000', rating: 4.9 },
        { name: 'Cleveland Clinic Metro Center', address: '9500 Euclid Ave', city: 'Cleveland', state: 'OH', phone: '+1-216-444-2200', rating: 4.8 },
        { name: 'Cedar Sinai Health Sciences', address: '8700 Beverly Blvd', city: 'Los Angeles', state: 'CA', phone: '+1-310-423-3277', rating: 4.8 }
      ];
      for (const h of hospitals) {
        await dbAdapter.create('Hospital', h);
      }
    }

    // 3. Ensure Specialties
    const specialtyCount = await dbAdapter.countDocuments('Specialty');
    if (specialtyCount === 0) {
      const specialtiesList = [
        { name: 'General Physician', description: 'Comprehensive primary care, preventative screening, and acute illness triage.', icon: 'Stethoscope' },
        { name: 'Cardiologist', description: 'Cardiovascular system, coronary health, arrhythmia, and arterial evaluation.', icon: 'Heart' },
        { name: 'Dermatologist', description: 'Skin, hair, follicular health, and dermatological lesion analysis.', icon: 'Sparkles' },
        { name: 'Neurologist', description: 'Brain, spinal cord, headache disorders, and central peripheral nerve pathways.', icon: 'Brain' },
        { name: 'Orthopedic', description: 'Bones, articular cartilage, ligaments, tendons, and sports injuries.', icon: 'Bone' },
        { name: 'Pediatrician', description: 'Infant, childhood, and adolescent health, growth, and vaccination.', icon: 'Baby' },
        { name: 'Gynecologist', description: 'Women\'s health, reproductive biology, endocrinology, and maternity.', icon: 'Users' },
        { name: 'ENT', description: 'Ear, nose, paranasal sinuses, pharynx, and auditory balance systems.', icon: 'Activity' },
        { name: 'Dentist', description: 'Dental structures, oral hygiene, periodontics, and maxilla health.', icon: 'Smile' },
        { name: 'Psychiatrist', description: 'Mental wellness, cognitive behavioral therapy, anxiety, and depression.', icon: 'Smile' },
        { name: 'Ophthalmologist', description: 'Ocular vision assessment, retinal care, and refractive corrections.', icon: 'Eye' },
        { name: 'Endocrinologist', description: 'Hormonal regulation, diabetes care, thyroid, and adrenal metabolism.', icon: 'Flame' }
      ];
      for (const spec of specialtiesList) {
        await dbAdapter.create('Specialty', spec);
      }
    }

    // 4. Ensure Doctor User & Profile
    const existingDoctor = await dbAdapter.findOne('User', { email: 'doctor@medainexus.com' }, '+password');
    if (!existingDoctor) {
      const doctorsData = [
        {
          name: 'Dr. Sarah Jenkins',
          email: 'doctor@medainexus.com',
          specialty: 'Cardiologist',
          qualifications: 'MD, FACC (Harvard Medical)',
          experienceYears: 14,
          registrationNumber: 'MED-NY-84920',
          hospital: 'Mount Sinai Medical Center',
          consultationFees: 80,
          city: 'New York',
          rating: 4.9,
          reviewsCount: 142,
          availableSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
          avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
        },
        {
          name: 'Dr. Marcus Vance',
          email: 'marcus.vance@medainexus.com',
          specialty: 'General Physician',
          qualifications: 'MBBS, MD (Internal Medicine)',
          experienceYears: 10,
          registrationNumber: 'MED-NY-77192',
          hospital: 'Mount Sinai Medical Center',
          consultationFees: 50,
          city: 'New York',
          rating: 4.8,
          reviewsCount: 98,
          availableSlots: ['08:30 AM', '10:00 AM', '01:30 PM', '03:30 PM'],
          avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
        }
      ];

      for (const docData of doctorsData) {
        const u = await dbAdapter.create('User', {
          name: docData.name,
          email: docData.email,
          password: doctorPassword,
          role: 'doctor',
          phone: '+1-555-0182',
          avatar: docData.avatar,
          isEmailVerified: true
        });

        const profile = await dbAdapter.create('DoctorProfile', {
          user: u._id || u.id,
          fullName: docData.name,
          specialty: docData.specialty,
          qualifications: docData.qualifications,
          experienceYears: docData.experienceYears,
          registrationNumber: docData.registrationNumber,
          hospital: docData.hospital,
          consultationFees: docData.consultationFees,
          city: docData.city,
          profilePhoto: docData.avatar,
          rating: docData.rating,
          reviewsCount: docData.reviewsCount,
          availableSlots: docData.availableSlots,
          isVerified: true
        });

        for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
          await dbAdapter.create('DoctorAvailability', {
            doctor: profile._id || profile.id,
            dayOfWeek: day,
            slots: docData.availableSlots,
            isAvailable: true
          });
        }
      }
    } else if (!existingDoctor.password) {
      await dbAdapter.findByIdAndUpdate('User', existingDoctor._id || existingDoctor.id, { password: doctorPassword });
    }

    // 5. Ensure Patient User & Profile
    const existingPatient = await dbAdapter.findOne('User', { email: 'patient@medainexus.com' }, '+password');
    if (!existingPatient) {
      const patientUser = await dbAdapter.create('User', {
        name: 'Johnathan Miller',
        email: 'patient@medainexus.com',
        password: patientPassword,
        role: 'patient',
        phone: '+1-555-0144',
        isEmailVerified: true
      });

      await dbAdapter.create('PatientProfile', {
        user: patientUser._id || patientUser.id,
        dateOfBirth: new Date('1994-06-15'),
        gender: 'male',
        bloodGroup: 'O+',
        heightCm: 178,
        weightKg: 72,
        allergies: ['Penicillin', 'Peanuts'],
        existingConditions: ['Mild Allergic Asthma', 'Seasonal Rhinitis'],
        currentMedications: ['Cetirizine 10mg as needed'],
        emergencyContact: {
          name: 'Eleanor Miller',
          relationship: 'Spouse',
          phone: '+1-555-0199'
        },
        city: 'New York',
        address: '742 Evergreen Terrace, Apt 4B',
        dietaryPreference: 'non-vegetarian',
        healthGoals: ['General healthy eating', 'Cardiovascular fitness']
      });
    } else if (!existingPatient.password) {
      await dbAdapter.findByIdAndUpdate('User', existingPatient._id || existingPatient.id, { password: patientPassword });
    }

    // Baseline Appointment
    const activePatient = existingPatient || (await dbAdapter.findOne('User', { email: 'patient@medainexus.com' }));
    const firstDoctor = await dbAdapter.findOne('DoctorProfile', { specialty: 'Cardiologist' });
    if (firstDoctor && activePatient) {
      await dbAdapter.create('Appointment', {
        patient: activePatient._id || activePatient.id,
        doctor: firstDoctor._id || firstDoctor.id,
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: '11:00 AM',
        consultationType: 'online',
        status: 'confirmed',
        reasonForVisit: 'Routine preventative cardiovascular checkup'
      });
    }

    console.log('[MedAI Nexus] Database Seeded Successfully!');
    console.log('[MedAI Nexus] Default Accounts:');
    console.log('   - Patient: patient@medainexus.com / Patient@123');
    console.log('   - Doctor:  doctor@medainexus.com  / Doctor@123');
    console.log('   - Admin:   admin@medainexus.com   / Admin@123');
  } catch (error) {
    console.error('[MedAI Nexus Seeding Error]', error.message);
  }
};

module.exports = { seedInitialData };
