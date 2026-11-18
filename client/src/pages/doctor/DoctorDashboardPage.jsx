import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Check,
  X,
  FileText,
  Video,
  Building,
  Plus,
  Trash2,
  Search,
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  Pill,
  ShieldCheck,
  Edit3,
  Save,
  Phone,
  Mail,
  FileCheck,
  Users,
  Briefcase,
  ChevronRight,
  Sparkles,
  Eye
} from 'lucide-react';

export default function DoctorDashboardPage({ activeTab: propTab }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve initial tab from prop or route path
  const getInitialTab = () => {
    if (propTab) return propTab;
    if (location.pathname.includes('/doctor/appointments')) return 'appointments';
    if (location.pathname.includes('/doctor/patients')) return 'patients';
    if (location.pathname.includes('/doctor/prescriptions')) return 'prescriptions';
    if (location.pathname.includes('/doctor/schedule')) return 'schedule';
    if (location.pathname.includes('/doctor/profile')) return 'profile';
    return 'overview';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);

  // Queue Filter & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Note Modal state
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');

  // Full Lab Report Modal state
  const [viewingReport, setViewingReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Prescription Form State
  const [rxForm, setRxForm] = useState({
    patientId: '',
    appointmentId: '',
    diagnosis: '',
    clinicalNotes: '',
    followUpDate: '',
    medicines: [
      { medicineName: '', dosage: '500mg', frequency: 'Twice daily (after meals)', duration: '5 days', instructions: 'Take with a full glass of water' }
    ]
  });

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    slots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
    newSlot: ''
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    specialty: '',
    qualifications: '',
    experienceYears: 10,
    registrationNumber: '',
    hospital: '',
    consultationFees: 75,
    city: '',
    bio: ''
  });

  useEffect(() => {
    setCurrentTab(getInitialTab());
  }, [location.pathname, propTab]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [resOverview, resPatients] = await Promise.all([
        api.get('/doctors/dashboard/overview'),
        api.get('/doctors/dashboard/patients').catch(() => ({ data: { success: true, patients: [] } }))
      ]);

      if (resOverview.data?.success) {
        const doc = resOverview.data.doctor;
        setDoctor(doc);
        setMetrics(resOverview.data.metrics || {});
        setAppointments(resOverview.data.recentAppointments || []);

        if (doc) {
          setProfileForm({
            fullName: doc.fullName || '',
            specialty: doc.specialty || '',
            qualifications: doc.qualifications || '',
            experienceYears: doc.experienceYears || 5,
            registrationNumber: doc.registrationNumber || '',
            hospital: doc.hospital || '',
            consultationFees: doc.consultationFees || 50,
            city: doc.city || '',
            bio: doc.bio || ''
          });

          if (doc.availableSlots && doc.availableSlots.length > 0) {
            setScheduleForm(prev => ({ ...prev, slots: doc.availableSlots }));
          }
        }
      }

      if (resPatients.data?.success) {
        setPatients(resPatients.data.patients || []);
      }
    } catch (e) {
      toast.error('Failed to load doctor clinical dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setCurrentTab(tab);
    if (tab === 'overview') navigate('/doctor-dashboard');
    else navigate(`/doctor/${tab}`);
  };

  // 1. Appointment Status Update
  const handleUpdateStatus = async (id, status, notes = '') => {
    try {
      await api.put(`/appointments/${id}`, { status, doctorNotes: notes });
      toast.success(`Appointment status updated to ${status}.`);
      setSelectedAppt(null);
      setConsultationNotes('');
      fetchInitialData();
    } catch (e) {
      toast.error('Failed to update appointment status.');
    }
  };

  // 2. Prescription Handlers
  const addMedicineRow = () => {
    setRxForm(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' }
      ]
    }));
  };

  const removeMedicineRow = (index) => {
    setRxForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setRxForm(prev => {
      const updated = [...prev.medicines];
      updated[index][field] = value;
      return { ...prev, medicines: updated };
    });
  };

  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    if (!rxForm.patientId) {
      toast.error('Please select a patient to prescribe medication.');
      return;
    }
    const hasEmptyMed = rxForm.medicines.some(m => !m.medicineName.trim());
    if (hasEmptyMed) {
      toast.error('Please specify medicine names for all prescribed rows.');
      return;
    }

    try {
      const res = await api.post('/doctors/dashboard/prescribe', rxForm);
      if (res.data?.success) {
        toast.success('Digital prescription issued and synced to patient records!');
        // Reset form
        setRxForm({
          patientId: '',
          appointmentId: '',
          diagnosis: '',
          clinicalNotes: '',
          followUpDate: '',
          medicines: [
            { medicineName: '', dosage: '500mg', frequency: 'Twice daily (after meals)', duration: '5 days', instructions: 'Take with a full glass of water' }
          ]
        });
        fetchInitialData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue digital prescription.');
    }
  };

  // Quick switch from appointment queue to prescription writer
  const quickPrescribeForAppointment = (appt) => {
    const pId = appt.patient?._id || appt.patient?.id || appt.patient;
    setRxForm(prev => ({
      ...prev,
      patientId: pId,
      appointmentId: appt._id || appt.id,
      diagnosis: appt.reasonForVisit || ''
    }));
    switchTab('prescriptions');
  };

  // Open Full Medical Lab Report Modal
  const handleOpenReport = async (report, patient = null) => {
    try {
      setReportLoading(true);
      const repId = report._id || report.id;
      const res = await api.get(`/reports/${repId}`);
      if (res.data?.success) {
        setViewingReport({
          ...res.data.report,
          patientName: patient?.name || res.data.report.patientName || 'Patient',
          patientEmail: patient?.email || '',
          patientId: patient?.id || patient?._id || res.data.report.user,
          extractedValues: res.data.extractedValues || report.extractedValues || []
        });
      } else {
        setViewingReport({
          ...report,
          patientName: patient?.name || 'Patient',
          patientEmail: patient?.email || '',
          patientId: patient?.id || patient?._id || report.user,
          extractedValues: report.extractedValues || []
        });
      }
    } catch (e) {
      setViewingReport({
        ...report,
        patientName: patient?.name || 'Patient',
        patientEmail: patient?.email || '',
        patientId: patient?.id || patient?._id || report.user,
        extractedValues: report.extractedValues || []
      });
    } finally {
      setReportLoading(false);
    }
  };

  // 3. Schedule Handlers
  const toggleWorkingDay = (day) => {
    setScheduleForm(prev => {
      const days = prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: days };
    });
  };

  const addSlot = () => {
    if (!scheduleForm.newSlot) return;
    if (scheduleForm.slots.includes(scheduleForm.newSlot)) {
      toast.error('Slot already exists.');
      return;
    }
    setScheduleForm(prev => ({
      ...prev,
      slots: [...prev.slots, prev.newSlot],
      newSlot: ''
    }));
  };

  const removeSlot = (slotToRemove) => {
    setScheduleForm(prev => ({
      ...prev,
      slots: prev.slots.filter(s => s !== slotToRemove)
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      await api.put('/doctors/dashboard/availability', {
        availableSlots: scheduleForm.slots,
        workingDays: scheduleForm.workingDays
      });
      toast.success('Practice availability schedule saved successfully.');
      fetchInitialData();
    } catch (e) {
      toast.error('Failed to update schedule.');
    }
  };

  // 4. Profile Handlers
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/doctors/dashboard/profile', profileForm);
      toast.success('Doctor practice credentials updated successfully.');
      fetchInitialData();
    } catch (e) {
      toast.error('Failed to update doctor profile.');
    }
  };

  const handleDeleteDoctorAccount = async () => {
    const confirmed = await toast.confirm({
      title: 'Permanently Delete Doctor Account?',
      message: 'Are you sure you want to permanently delete your medical doctor account and practice credentials?\n\nThis will permanently delete your doctor profile, license verification, practice availability slots, and consultation history.',
      confirmText: 'Delete Doctor Account',
      cancelText: 'Keep Account',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await api.delete('/auth/account');
      toast.success('Your doctor account and practice records have been permanently erased.');
      logout();
    } catch (e) {
      toast.error('Failed to delete doctor account.');
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(appt => {
    const matchesStatus = statusFilter === 'all' || appt.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      appt.patientName?.toLowerCase().includes(query) ||
      appt.reasonForVisit?.toLowerCase().includes(query) ||
      appt.timeSlot?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Specialist Clinical Header Card */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 shadow-inner">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  Verified Specialist Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Available for Consultations
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {doctor?.fullName || user?.name || 'Medical Specialist'}
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/80 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Specialty: <strong className="text-white">{doctor?.specialty || 'General Medicine'}</strong></span>
                <span>•</span>
                <span>Hospital: <strong className="text-white">{doctor?.hospital || 'Mount Sinai Medical'}</strong></span>
                <span>•</span>
                <span>Licence: <strong className="text-white font-mono">{doctor?.registrationNumber || 'MED-VERIFIED'}</strong></span>
                <span>•</span>
                <span>Fee: <strong className="text-white">${doctor?.consultationFees || 50}/visit</strong></span>
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-teal-700/50">
            <span className="text-[11px] text-teal-200">Session Queue</span>
            <span className="text-3xl font-black text-white">{metrics.confirmedCount || 0}</span>
            <span className="text-[10px] text-teal-300/80">Active Confirmed Visits</span>
          </div>
        </div>
      </div>

      {/* 2. Doctor Primary Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl overflow-x-auto text-xs font-semibold border border-slate-200/80 shadow-sm scrollbar-none">
        {[
          { id: 'overview', label: 'Clinical Overview', icon: Activity },
          { id: 'appointments', label: 'Patient Consultations', icon: Calendar },
          { id: 'patients', label: 'Patient Health Records', icon: Users },
          { id: 'prescriptions', label: 'Write Digital Rx', icon: FileCheck },
          { id: 'schedule', label: 'Schedule & Hours', icon: Clock },
          { id: 'profile', label: 'Practice Profile', icon: Briefcase }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-white text-teal-800 shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.id === 'appointments' && metrics.pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                  {metrics.pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Consultations
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900">{metrics.totalAppointments || 0}</span>
                <Calendar className="w-5 h-5 text-slate-300" />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block mb-1">
                Confirmed Bookings
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-teal-700">{metrics.confirmedCount || 0}</span>
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                Pending Triage
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-amber-600">{metrics.pendingCount || 0}</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                Completed Sessions
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-700">{metrics.completedCount || 0}</span>
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Quick Doctor Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => switchTab('prescriptions')}
              className="p-5 bg-gradient-to-br from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 rounded-2xl border border-teal-200/80 text-left transition-all shadow-sm group"
            >
              <FileCheck className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold text-teal-900">Issue Digital Prescription</h3>
              <p className="text-xs text-teal-700/80 mt-1">Prescribe medication regimen, dosages, and instructions directly to patient schedule.</p>
            </button>

            <button
              onClick={() => switchTab('patients')}
              className="p-5 bg-gradient-to-br from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 rounded-2xl border border-sky-200/80 text-left transition-all shadow-sm group"
            >
              <Users className="w-6 h-6 text-sky-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold text-sky-900">Review Patient Lab Biomarkers</h3>
              <p className="text-xs text-sky-700/80 mt-1">Inspect patient clinical summaries, blood tests, and AI-flagged abnormal lab parameters.</p>
            </button>

            <button
              onClick={() => switchTab('schedule')}
              className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-2xl border border-amber-200/80 text-left transition-all shadow-sm group"
            >
              <Clock className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold text-amber-900">Manage Practice Schedule</h3>
              <p className="text-xs text-amber-700/80 mt-1">Update consultation hours, working days, and slot availability across the platform.</p>
            </button>
          </div>

          {/* Today's Priority Queue Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Upcoming Patient Consultations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Direct triage queue for your verified specialist appointments.</p>
              </div>
              <button
                onClick={() => switchTab('appointments')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                View Full Queue <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading consultation queue...</div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No patient bookings currently scheduled. Check back when patients book consultations.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.slice(0, 5).map(appt => (
                  <div key={appt._id || appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 rounded-xl px-2 transition">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs shrink-0">
                        {appt.patientName ? appt.patientName.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800">{appt.patientName || 'Patient Consultation'}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            appt.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Reason: <span className="text-slate-700 font-medium">{appt.reasonForVisit}</span>
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-1">
                          <span>{new Date(appt.appointmentDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{appt.timeSlot}</span>
                          <span>•</span>
                          <span className="capitalize">{appt.consultationType} Mode</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {appt.status === 'confirmed' && appt.consultationType === 'online' && (
                        <a
                          href={appt.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" /> Video Call
                        </a>
                      )}
                      {appt.status !== 'completed' && (
                        <button
                          onClick={() => quickPrescribeForAppointment(appt)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Pill className="w-3.5 h-3.5" /> Write Rx
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT CONSULTATIONS QUEUE */}
      {currentTab === 'appointments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                Specialist Consultation Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage patient visit confirmations, join telehealth rooms, and record post-visit findings.</p>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
              {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg capitalize transition ${
                    statusFilter === st ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, reason, or time..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No appointments found matching your search and filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Patient & Contact</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Consultation Mode</th>
                    <th className="py-3 px-4">Reason for Visit</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Clinical Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map(appt => (
                    <tr key={appt._id || appt.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{appt.patientName || 'Registered Patient'}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {appt.patientEmail || 'Verified Patient'}
                        </div>
                        {appt.patientPhone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {appt.patientPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {new Date(appt.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {appt.timeSlot}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="capitalize font-semibold text-slate-700 flex items-center gap-1.5">
                          {appt.consultationType === 'online' ? (
                            <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1 text-[11px]">
                              <Video className="w-3 h-3" /> Online Telehealth
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1 text-[11px]">
                              <Building className="w-3 h-3" /> In-Clinic Visit
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-slate-700 font-medium line-clamp-2">{appt.reasonForVisit}</span>
                        {appt.doctorNotes && (
                          <div className="text-[10px] text-teal-700 mt-1 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                            Notes: {appt.doctorNotes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          appt.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                          appt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(appt._id || appt.id, 'confirmed')}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Accept
                          </button>
                        )}
                        {appt.status === 'confirmed' && appt.consultationType === 'online' && (
                          <a
                            href={appt.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <Video className="w-3 h-3" /> Join Room
                          </a>
                        )}
                        {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => quickPrescribeForAppointment(appt)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold transition"
                            >
                              Prescribe Rx
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppt(appt);
                                setConsultationNotes(appt.doctorNotes || '');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                            >
                              Add Notes
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appt._id || appt.id, 'completed', 'Consultation finished')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition"
                            >
                              Done
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Notes Modal */}
          {selectedAppt && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-slide-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-teal-600" />
                    Consultation Clinical Notes
                  </h3>
                  <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Record your diagnostic impression and instructions for patient: <strong>{selectedAppt.patientName}</strong>
                </p>
                <textarea
                  rows={4}
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="e.g. Patient presents with mild elevated systolic BP. Recommended dietary sodium reduction and 2 weeks monitoring."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedAppt(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAppt._id || selectedAppt.id, selectedAppt.status, consultationNotes)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PATIENT HEALTH RECORDS DIRECTORY */}
      {currentTab === 'patients' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Patient Clinical Dossiers & Lab Reports
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review clinical summaries, known allergies, chronic conditions, and AI-extracted biomarker lab results for your patients.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading patient records...</div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No patient clinical dossiers found. Patient profiles will automatically populate when patients book consultations.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {patients.map(p => (
                <div key={p.id} className="p-5 rounded-2xl border border-slate-200 hover:border-teal-200 transition bg-slate-50/40 space-y-4">
                  {/* Patient Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100/70 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                        <p className="text-xs text-slate-500">{p.email}</p>
                        <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                          {p.totalVisits} Total Consultations
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setRxForm(prev => ({ ...prev, patientId: p.id }));
                        switchTab('prescriptions');
                      }}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                    >
                      <Pill className="w-3.5 h-3.5" /> Prescribe
                    </button>
                  </div>

                  {/* Clinical Vitals & Tags */}
                  {p.profile && (
                    <div className="grid grid-cols-3 gap-2 text-[11px] bg-white p-3 rounded-xl border border-slate-100 text-center">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Blood Group</span>
                        <strong className="text-slate-800">{p.profile.bloodGroup || 'Not specified'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Height / Weight</span>
                        <strong className="text-slate-800">{p.profile.heightCm || 175}cm / {p.profile.weightKg || 70}kg</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Diet Preference</span>
                        <strong className="text-slate-800 capitalize">{p.profile.dietaryPreference || 'Standard'}</strong>
                      </div>
                    </div>
                  )}

                  {/* Allergies & Existing Conditions */}
                  {p.profile && (
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">Documented Allergies:</span>
                        <div className="flex flex-wrap gap-1">
                          {p.profile.allergies?.length > 0 ? (
                            p.profile.allergies.map(a => (
                              <span key={a} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold">
                                {a}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">No known drug allergies</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">Pre-existing Conditions:</span>
                        <div className="flex flex-wrap gap-1">
                          {p.profile.existingConditions?.length > 0 ? (
                            p.profile.existingConditions.map(c => (
                              <span key={c} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-semibold">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">None recorded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Medical Lab Reports */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-teal-600" /> Patient Medical Lab Reports ({p.reports?.length || 0})
                      </span>
                      <span className="text-[10px] text-teal-600 font-semibold">Click to view full report</span>
                    </div>

                    {p.reports?.length > 0 ? (
                      <div className="space-y-2">
                        {p.reports.map(r => (
                          <div
                            key={r._id || r.id}
                            onClick={() => handleOpenReport(r, p)}
                            className="p-3 bg-white hover:bg-teal-50/60 rounded-xl border border-slate-200 hover:border-teal-300 text-[11px] cursor-pointer transition shadow-sm group"
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span className="flex items-center gap-1.5 text-slate-900 group-hover:text-teal-700 font-bold">
                                <FileText className="w-3.5 h-3.5 text-teal-600" />
                                {r.title}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  r.overallHealthRisk === 'Normal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  r.overallHealthRisk === 'Attention Needed' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  r.overallHealthRisk === 'Critical Attention' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {r.overallHealthRisk || 'Analyzed'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(r.createdAt || r.reportDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {r.aiSummary || 'Click to review extracted diagnostic biomarkers, lab values, and clinical notes.'}
                            </p>
                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-teal-600 font-semibold">
                              <span>
                                {r.extractedValues?.length > 0 ? `${r.extractedValues.length} Biomarkers identified` : 'Diagnostic document'}
                              </span>
                              <span className="flex items-center gap-1 text-teal-700 group-hover:translate-x-0.5 transition">
                                <Eye className="w-3 h-3" /> View Full Report & Biomarkers &rarr;
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic bg-white p-3 rounded-xl border border-dashed border-slate-200 text-center">
                        No lab reports uploaded by this patient yet.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DIGITAL PRESCRIPTION WRITER PAD */}
      {currentTab === 'prescriptions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                Physician Digital Prescription Pad (Rx)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue signed electronic prescriptions. Automatically schedules medication compliance reminders in the patient's portal.
              </p>
            </div>
            <div className="text-[11px] font-mono text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              Prescriber: {doctor?.fullName || 'Verified Medical Doctor'}
            </div>
          </div>

          <form onSubmit={handleIssuePrescription} className="space-y-6">
            {/* Patient & Diagnosis Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={rxForm.patientId}
                  onChange={(e) => setRxForm({ ...rxForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">-- Choose Patient from Practice --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                  {/* Fallback to appointments list if patients array is small */}
                  {patients.length === 0 && appointments.map(a => (
                    <option key={a.patient} value={a.patient}>
                      {a.patientName} (Appointment ID: {a._id || a.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Diagnosis / Indication *</label>
                <input
                  type="text"
                  required
                  value={rxForm.diagnosis}
                  onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })}
                  placeholder="e.g. Acute Bronchitis / Essential Hypertension"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Prescribed Medications Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-teal-600" /> Prescribed Medications (Rx Table)
                </span>
                <button
                  type="button"
                  onClick={addMedicineRow}
                  className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medication
                </button>
              </div>

              <div className="space-y-3">
                {rxForm.medicines.map((med, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-teal-800">Rx #{idx + 1}</span>
                      {rxForm.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Drug Name *</label>
                        <input
                          type="text"
                          required
                          value={med.medicineName}
                          onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                          placeholder="e.g. Amoxicillin Trihydrate"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dosage / Strength</label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg, 1 tablet"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration</label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                          placeholder="e.g. 5 days, 1 month"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Frequency</label>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                          placeholder="e.g. Twice daily (morning & night), 1-0-1"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Special Instructions</label>
                        <input
                          type="text"
                          value={med.instructions}
                          onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                          placeholder="e.g. Take after food with full glass of water"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Instructions & Follow-up */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physician Clinical Advice / Dietary Warnings</label>
                <textarea
                  rows={3}
                  value={rxForm.clinicalNotes}
                  onChange={(e) => setRxForm({ ...rxForm, clinicalNotes: e.target.value })}
                  placeholder="e.g. Hydrate adequately. Avoid strenuous physical exertion for 48 hours. Report fever > 101 F."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Review Date</label>
                <input
                  type="date"
                  value={rxForm.followUpDate}
                  onChange={(e) => setRxForm({ ...rxForm, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRxForm({
                  patientId: '',
                  appointmentId: '',
                  diagnosis: '',
                  clinicalNotes: '',
                  followUpDate: '',
                  medicines: [{ medicineName: '', dosage: '500mg', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' }]
                })}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Sign & Issue Digital Rx
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: PRACTICE SCHEDULE & AVAILABILITY */}
      {currentTab === 'schedule' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Physician Consultation Availability Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define the days and booking slots when patients can reserve online telehealth or clinic visits with you.
            </p>
          </div>

          <div className="space-y-6 max-w-3xl">
            {/* Working Days */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Weekly Consultation Days</label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                  const isSelected = scheduleForm.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkingDay(day)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Configured Appointment Slots</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {scheduleForm.slots.map(slot => (
                  <span
                    key={slot}
                    className="px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-xs font-bold text-teal-800 flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    {slot}
                    <button
                      type="button"
                      onClick={() => removeSlot(slot)}
                      className="text-slate-400 hover:text-rose-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Slot Input */}
              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  value={scheduleForm.newSlot}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, newSlot: e.target.value })}
                  placeholder="e.g. 03:30 PM"
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
                />
                <button
                  type="button"
                  onClick={addSlot}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition shrink-0"
                >
                  Add Slot
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Schedule Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PHYSICIAN PRACTICE PROFILE */}
      {currentTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-teal-600" />
              Specialist Practice & Credential Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain your medical license details, clinical degrees, hospital affiliation, and consultation fees.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal & Medical Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Specialty</label>
                <input
                  type="text"
                  required
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Qualifications & Degrees</label>
                <input
                  type="text"
                  required
                  value={profileForm.qualifications}
                  onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                  placeholder="e.g. MBBS, MD, FACC"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical License / Registration No.</label>
                <input
                  type="text"
                  required
                  value={profileForm.registrationNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Clinic Affiliation</label>
                <input
                  type="text"
                  value={profileForm.hospital}
                  onChange={(e) => setProfileForm({ ...profileForm, hospital: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Practice City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee ($ per visit)</label>
                <input
                  type="number"
                  min="0"
                  value={profileForm.consultationFees}
                  onChange={(e) => setProfileForm({ ...profileForm, consultationFees: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Clinical Statement / Bio</label>
              <textarea
                rows={3}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Share your clinical focus, research interests, and patient care philosophy..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDeleteDoctorAccount}
                className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Doctor Account & Practice
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Practice Credentials
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FULL MEDICAL REPORT & BIOMARKERS MODAL FOR DOCTOR */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-200 animate-slide-in space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    Diagnostic Lab Report
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    viewingReport.overallHealthRisk === 'Normal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    viewingReport.overallHealthRisk === 'Attention Needed' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    viewingReport.overallHealthRisk === 'Critical Attention' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    Risk: {viewingReport.overallHealthRisk || 'Analyzed'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900">{viewingReport.title}</h2>
                <p className="text-xs text-slate-500">
                  Patient: <strong className="text-slate-800">{viewingReport.patientName}</strong> {viewingReport.patientEmail && `(${viewingReport.patientEmail})`} • Uploaded: {new Date(viewingReport.createdAt || viewingReport.reportDate).toLocaleDateString()}
                </p>
                {viewingReport.originalFilename && (
                  <p className="text-[11px] text-slate-400">
                    Source File: {viewingReport.originalFilename}
                  </p>
                )}
              </div>

              <button
                onClick={() => setViewingReport(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Clinical Summary Banner */}
            {viewingReport.aiSummary && (
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" /> AI Diagnostic Summary & Interpretation
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{viewingReport.aiSummary}</p>
              </div>
            )}

            {/* Extracted Biomarker Test Parameters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  Extracted Biomarker Test Parameters ({viewingReport.extractedValues?.length || 0})
                </h3>
              </div>

              {(!viewingReport.extractedValues || viewingReport.extractedValues.length === 0) ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
                  <AlertTriangle className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700">No structured biomarkers extracted</div>
                  <p className="text-[11px] text-slate-500">
                    The document did not contain standard numerical blood parameters, or was an unstructured medical summary.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Test Parameter</th>
                        <th className="py-2.5 px-3">Value</th>
                        <th className="py-2.5 px-3">Reference Interval</th>
                        <th className="py-2.5 px-3">Clinical Status</th>
                        <th className="py-2.5 px-3">Diagnostic Meaning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingReport.extractedValues.map((v, i) => (
                        <tr key={v._id || v.id || i} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{v.parameter}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {v.value} {v.unit}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                            {v.referenceRange || 'Standard'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              v.status === 'Normal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              v.status === 'Above reference range' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs">{v.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Doctor Questions / Clinical Recommendations */}
            {viewingReport.doctorQuestions?.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-sky-600" /> Recommended Physician Review Points
                </h4>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                  {viewingReport.doctorQuestions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw OCR / Text Excerpt if available */}
            {viewingReport.ocrRawText && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Original Document Text Excerpt
                </span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 max-h-36 overflow-y-auto whitespace-pre-line">
                  {viewingReport.ocrRawText}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const pId = viewingReport.patientId;
                  setViewingReport(null);
                  if (pId) {
                    setRxForm(prev => ({
                      ...prev,
                      patientId: pId,
                      diagnosis: `Follow-up on ${viewingReport.title}`
                    }));
                  }
                  switchTab('prescriptions');
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <Pill className="w-4 h-4" /> Prescribe Rx for this Patient
              </button>

              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
