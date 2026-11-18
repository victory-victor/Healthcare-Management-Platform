import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  User,
  Heart,
  Save,
  Shield,
  Phone,
  MapPin,
  AlertCircle,
  Trash2,
  Lock,
  Activity
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say',
    bloodGroup: 'Unknown',
    heightCm: 170,
    weightKg: 68,
    allergies: '',
    existingConditions: '',
    currentMedications: '',
    emergencyName: '',
    emergencyRel: '',
    emergencyPhone: '',
    address: '',
    city: 'New York',
    dietaryPreference: 'non-vegetarian'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients/profile');
      if (res.data?.success && res.data.profile) {
        const p = res.data.profile;
        setFormData({
          name: p.user?.name || user?.name || '',
          phone: p.user?.phone || user?.phone || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          gender: p.gender || 'prefer_not_to_say',
          bloodGroup: p.bloodGroup || 'Unknown',
          heightCm: p.heightCm || 170,
          weightKg: p.weightKg || 68,
          allergies: (p.allergies || []).join(', '),
          existingConditions: (p.existingConditions || []).join(', '),
          currentMedications: (p.currentMedications || []).join(', '),
          emergencyName: p.emergencyContact?.name || '',
          emergencyRel: p.emergencyContact?.relationship || '',
          emergencyPhone: p.emergencyContact?.phone || '',
          address: p.address || '',
          city: p.city || 'New York',
          dietaryPreference: p.dietaryPreference || 'non-vegetarian'
        });
      }
    } catch (e) {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        heightCm: Number(formData.heightCm),
        weightKg: Number(formData.weightKg),
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        existingConditions: formData.existingConditions ? formData.existingConditions.split(',').map(s => s.trim()) : [],
        currentMedications: formData.currentMedications ? formData.currentMedications.split(',').map(s => s.trim()) : [],
        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRel,
          phone: formData.emergencyPhone
        },
        address: formData.address,
        city: formData.city,
        dietaryPreference: formData.dietaryPreference
      };

      const res = await api.put('/patients/profile', payload);
      if (res.data?.success) {
        toast.success('Patient profile updated successfully!');
        updateUser({ name: formData.name, phone: formData.phone });
      }
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await toast.confirm({
      title: 'Permanently Delete Medical Account?',
      message: 'Are you sure you want to permanently delete your medical account and all personal health records?\n\nThis will permanently erase your profile, all uploaded lab reports and biomarkers, prescription scans, medicine schedules, AI symptom history, diet plans, and appointments.',
      confirmText: 'Delete My Account & All Data',
      cancelText: 'Keep My Account',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await api.delete('/auth/account');
      toast.success('Your account and all medical records have been permanently erased.');
      logout();
    } catch (e) {
      toast.error('Failed to delete account.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-sky-600" /> Patient Medical Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain your personal clinical baseline used to personalize AI symptom analysis and dietary planning.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" /> General Identification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1-555-0100"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Clinical Baseline & Vitals */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" /> Clinical Baseline & Vitals
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="Unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diet Preference</label>
              <select
                name="dietaryPreference"
                value={formData.dietaryPreference}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="non-vegetarian">Non-Vegetarian</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="jain">Jain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">City & State</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. New York, NY"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Medical History & Allergies */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" /> Allergies & Chronic Conditions
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies (Comma separated)</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="e.g. Penicillin, Peanuts, Pollen"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Existing Medical Conditions</label>
              <input
                type="text"
                name="existingConditions"
                value={formData.existingConditions}
                onChange={handleChange}
                placeholder="e.g. Mild Hypertension, Asthma, Type 2 Diabetes"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Regular Medications</label>
              <input
                type="text"
                name="currentMedications"
                value={formData.currentMedications}
                onChange={handleChange}
                placeholder="e.g. Metformin 500mg, Cetirizine 10mg"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" /> Emergency Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
              <input
                type="text"
                name="emergencyName"
                value={formData.emergencyName}
                onChange={handleChange}
                placeholder="e.g. Eleanor Miller"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
              <input
                type="text"
                name="emergencyRel"
                value={formData.emergencyRel}
                onChange={handleChange}
                placeholder="e.g. Spouse / Parent / Sibling"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                placeholder="+1-555-0199"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Delete Account & Data
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
