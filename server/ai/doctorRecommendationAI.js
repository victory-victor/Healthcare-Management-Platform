/**
 * Module 6: AI Doctor Recommendation Engine
 * MedAI Nexus Healthcare Platform
 */

const SPECIALTY_MAPPINGS = {
  headache: 'Neurologist',
  migraine: 'Neurologist',
  dizziness: 'Neurologist',
  seizure: 'Neurologist',
  chest: 'Cardiologist',
  heart: 'Cardiologist',
  palpitations: 'Cardiologist',
  hypertension: 'Cardiologist',
  skin: 'Dermatologist',
  rash: 'Dermatologist',
  acne: 'Dermatologist',
  itching: 'Dermatologist',
  joint: 'Orthopedic',
  knee: 'Orthopedic',
  bone: 'Orthopedic',
  fracture: 'Orthopedic',
  backache: 'Orthopedic',
  stomach: 'Gastroenterologist',
  digestion: 'Gastroenterologist',
  acid: 'Gastroenterologist',
  liver: 'Gastroenterologist',
  diarrhea: 'Gastroenterologist',
  child: 'Pediatrician',
  infant: 'Pediatrician',
  baby: 'Pediatrician',
  ear: 'ENT',
  throat: 'ENT',
  nose: 'ENT',
  sinus: 'ENT',
  hearing: 'ENT',
  tooth: 'Dentist',
  teeth: 'Dentist',
  gum: 'Dentist',
  mental: 'Psychiatrist',
  anxiety: 'Psychiatrist',
  depression: 'Psychiatrist',
  eye: 'Ophthalmologist',
  vision: 'Ophthalmologist',
  thyroid: 'Endocrinologist',
  diabetes: 'Endocrinologist',
  hormone: 'Endocrinologist',
  pregnancy: 'Gynecologist',
  period: 'Gynecologist'
};

const recommendSpecialty = (queryOrSymptoms) => {
  const lower = String(queryOrSymptoms || '').toLowerCase();
  for (const [keyword, specialty] of Object.entries(SPECIALTY_MAPPINGS)) {
    if (lower.includes(keyword)) {
      return {
        specialty,
        reason: `Your stated symptoms mention "${keyword}", which is routinely evaluated by a specialist in ${specialty}.`
      };
    }
  }

  return {
    specialty: 'General Physician',
    reason: 'A General Physician or Family Medicine Practitioner is the ideal initial point of clinical contact for comprehensive physical evaluation.'
  };
};

module.exports = {
  recommendSpecialty,
  SPECIALTY_MAPPINGS
};
