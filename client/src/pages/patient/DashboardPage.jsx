import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  HeartPulse,
  Stethoscope,
  FileText,
  Pill,
  Utensils,
  Calendar,
  Bot,
  UserCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();

  // Route protection: Doctors have their own clinical portal
  if (user?.role === 'doctor') {
    return <Navigate to="/doctor-dashboard" replace />;
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [showVitalModal, setShowVitalModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [resOverview, resMetrics] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/dashboard/health-metrics')
      ]);

      if (resOverview.data?.success) setData(resOverview.data.overview);
      if (resMetrics.data?.success) setMetrics(resMetrics.data.metrics || []);
    } catch (err) {
      toast.error('Could not load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaken = async (reminderId) => {
    try {
      await api.put(`/prescriptions/reminders/${reminderId}/status`, { status: 'taken' });
      toast.success('Medication marked as taken!');
      fetchDashboardData();
    } catch (e) {
      toast.error('Failed to update medication status.');
    }
  };

  const handleLogVital = async (e) => {
    e.preventDefault();
    if (!newWeight) return;
    try {
      await api.post('/dashboard/health-metrics', {
        weightKg: Number(newWeight),
        systolicBp: 120,
        diastolicBp: 80,
        bloodGlucoseMgDl: 96
      });
      toast.success('Vitals recorded successfully.');
      setNewWeight('');
      setShowVitalModal(false);
      fetchDashboardData();
    } catch (e) {
      toast.error('Failed to log vital.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading your medical overview...</p>
        </div>
      </div>
    );
  }

  // Format metrics chart data
  const chartData = metrics.map((m) => ({
    date: new Date(m.recordedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: m.weightKg,
    systolic: m.systolicBp || 120,
    diastolic: m.diastolicBp || 80,
    glucose: m.bloodGlucoseMgDl || 95
  }));

  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur rounded-full text-xs font-semibold text-sky-100">
            <HeartPulse className="w-4 h-4 text-sky-200" />
            Patient Clinical Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Patient'}
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
            Your personal clinical dashboard is synchronized. All biomarkers, upcoming appointments, and daily medications are up to date.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/symptoms"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-sky-700 hover:bg-sky-50 text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Stethoscope className="w-3.5 h-3.5" /> Check Symptoms
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold rounded-xl transition"
            >
              <Bot className="w-3.5 h-3.5" /> Consult AI Assistant
            </Link>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <HeartPulse className="w-96 h-96" />
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reports Processed</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalReports || 0}</div>
            <Link to="/reports" className="text-[11px] font-semibold text-sky-600 hover:underline flex items-center gap-1 mt-1">
              View reports <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Reminders</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats.activeRemindersCount || 0}</div>
            <Link to="/prescriptions" className="text-[11px] font-semibold text-teal-600 hover:underline flex items-center gap-1 mt-1">
              Medication list <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Upcoming Visits</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats.upcomingAppointments || 0}</div>
            <Link to="/appointments" className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1 mt-1">
              Schedule <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Symptom Checks</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalSymptomAnalyses || 0}</div>
            <Link to="/symptoms" className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 mt-1">
              Analyze new <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Row */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Quick Healthcare Actions</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <Link
            to="/symptoms"
            className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50 hover:border-sky-200 border border-slate-200/60 text-center transition flex flex-col items-center gap-1.5 group"
          >
            <Stethoscope className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-slate-700">Check Symptoms</span>
          </Link>
          <Link
            to="/reports"
            className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200/60 text-center transition flex flex-col items-center gap-1.5 group"
          >
            <FileText className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-slate-700">Upload Report</span>
          </Link>
          <Link
            to="/prescriptions"
            className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200/60 text-center transition flex flex-col items-center gap-1.5 group"
          >
            <Pill className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-slate-700">Scan Rx</span>
          </Link>
          <Link
            to="/diet"
            className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200/60 text-center transition flex flex-col items-center gap-1.5 group"
          >
            <Utensils className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-slate-700">Diet Planner</span>
          </Link>
          <Link
            to="/doctors"
            className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200/60 text-center transition flex flex-col items-center gap-1.5 group"
          >
            <UserCheck className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-slate-700">Find Doctor</span>
          </Link>
          <Link
            to="/chat"
            className="p-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200/60 text-center transition flex flex-col items-center gap-1.5 group"
          >
            <Bot className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-slate-700">Ask Assistant</span>
          </Link>
        </div>
      </div>

      {/* Interactive Charts Section (Weight, BP, Glucose) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Tracking Chart */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Weight Metric History (kg)</h2>
              <p className="text-[11px] text-slate-400">Longitudinal physical body mass monitoring</p>
            </div>
            <button
              onClick={() => setShowVitalModal(true)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" /> Log Vital
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} unit=" kg" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#0284c7" strokeWidth={2.5} fill="url(#weightGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blood Pressure & Glucose Chart */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Blood Pressure & Fasting Glucose</h2>
              <p className="text-[11px] text-slate-400">Systolic, Diastolic (mmHg) & Glucose (mg/dL)</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Systolic</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Diastolic</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Glucose</span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[50, 150]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolic" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="glucose" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two-Column Clinical Schedule & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medication Reminders Checklist */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" /> Today's Medication Schedule
            </h2>
            <Link to="/prescriptions" className="text-xs font-semibold text-teal-600 hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-2.5">
            {(!data?.medicationReminders || data.medicationReminders.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active medication reminders today.</p>
            ) : (
              data.medicationReminders.map((rem) => (
                <div
                  key={rem._id || rem.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{rem.medicineName}</div>
                      <div className="text-[11px] text-slate-400">
                        {rem.dosage} • Time: {rem.timeOfDay}
                      </div>
                    </div>
                  </div>

                  {rem.statusToday === 'taken' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Taken
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkTaken(rem._id || rem.id)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
                    >
                      Mark Taken
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" /> Upcoming Consultations
            </h2>
            <Link to="/appointments" className="text-xs font-semibold text-sky-600 hover:underline">
              Book Doctor
            </Link>
          </div>

          <div className="space-y-2.5">
            {(!data?.upcomingAppointments || data.upcomingAppointments.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming consultations booked.</p>
            ) : (
              data.upcomingAppointments.map((appt) => (
                <div
                  key={appt._id || appt.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{appt.doctor?.fullName || 'Specialist'}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.timeSlot} • {appt.consultationType}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 rounded-full border border-sky-200">
                    Confirmed
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Log Vital Modal */}
      {showVitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Record New Vital Metric</h3>
              <button onClick={() => setShowVitalModal(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>
            <form onSubmit={handleLogVital} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Body Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="e.g. 70.5"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVitalModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
