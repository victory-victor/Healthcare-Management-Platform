import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  UserCheck,
  Search,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  Calendar,
  Filter,
  DollarSign
} from 'lucide-react';

export default function FindDoctorsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [symptomQuery, setSymptomQuery] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState(null);

  useEffect(() => {
    fetchSpecialties();
    fetchDoctors();
  }, [selectedSpecialty, selectedCity, maxFee]);

  const fetchSpecialties = async () => {
    try {
      const res = await api.get('/doctors/specialties');
      if (res.data?.success) setSpecialties(res.data.specialties || []);
    } catch (e) {}
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedSpecialty !== 'all') params.specialty = selectedSpecialty;
      if (selectedCity !== 'all') params.city = selectedCity;
      if (searchQuery) params.search = searchQuery;
      if (maxFee) params.maxFee = maxFee;
      if (symptomQuery) params.symptomQuery = symptomQuery;

      const res = await api.get('/doctors', { params });
      if (res.data?.success) {
        setDoctors(res.data.doctors || []);
        if (res.data.aiRecommendation) {
          setAiRecommendation(res.data.aiRecommendation);
        }
      }
    } catch (e) {
      toast.error('Failed to load doctors directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiSearch = (e) => {
    e.preventDefault();
    if (!symptomQuery.trim()) return;
    fetchDoctors();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-600" /> Find Verified Doctors & Specialists
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Discover board-certified practitioners, compare clinical credentials, and book online or in-person visits.
          </p>
        </div>
      </div>

      {/* AI Specialty Matcher Bar */}
      <div className="p-5 bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-200 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
          <Sparkles className="w-4 h-4 text-sky-600" /> AI Medical Specialty Recommender
        </div>
        <form onSubmit={handleAiSearch} className="flex gap-2">
          <input
            type="text"
            value={symptomQuery}
            onChange={(e) => setSymptomQuery(e.target.value)}
            placeholder="Describe what you are feeling (e.g. 'sharp chest pain with irregular heart rate')..."
            className="flex-1 px-3.5 py-2 text-xs bg-white border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Match Specialty
          </button>
        </form>

        {aiRecommendation && (
          <div className="p-3 bg-white/90 border border-sky-200 rounded-xl text-xs space-y-1 animate-fade-in">
            <div className="font-bold text-sky-900">
              Suggested Specialty: <span className="text-sky-600 font-extrabold">{aiRecommendation.specialty}</span>
            </div>
            <p className="text-slate-600 text-[11px]">{aiRecommendation.reason}</p>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Doctor / Hospital</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDoctors()}
              placeholder="e.g. Jenkins or Mount Sinai"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Specialty</label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
          >
            <option value="all">All Specialties</option>
            {specialties.map((s) => (
              <option key={s._id || s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">City / Region</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
          >
            <option value="all">All Locations</option>
            <option value="New York">New York, NY</option>
            <option value="Baltimore">Baltimore, MD</option>
            <option value="Los Angeles">Los Angeles, CA</option>
            <option value="Cleveland">Cleveland, OH</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Consultation Fee ($)</label>
          <input
            type="number"
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value)}
            placeholder="e.g. 80"
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
          />
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Searching verified physician network...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          No medical specialists found matching your current filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc._id || doc.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={doc.profilePhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'}
                    alt={doc.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900">{doc.fullName}</h3>
                      {doc.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" title="Verified Medical License" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-sky-700">{doc.specialty}</div>
                    <div className="text-[11px] text-slate-400">{doc.qualifications}</div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.hospital}, {doc.city}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {doc.rating} ({doc.reviewsCount} reviews)
                    </span>
                    <span className="font-bold text-slate-800">
                      ${doc.consultationFees} / visit
                    </span>
                  </div>
                </div>

                {/* Available Slots Pills */}
                {doc.availableSlots?.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Next Open Slots</span>
                    <div className="flex flex-wrap gap-1">
                      {doc.availableSlots.slice(0, 3).map((slot, sIdx) => (
                        <span key={sIdx} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate(`/appointments?doctor=${doc._id || doc.id}`)}
                className="w-full py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" /> Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
