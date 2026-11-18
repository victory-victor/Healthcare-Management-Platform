import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  History,
  FileText,
  Pill,
  Calendar,
  Stethoscope,
  Activity,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function HealthHistoryPage() {
  const toast = useToast();

  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const [resReports, resPrescriptions, resAppts, resSymptoms] = await Promise.all([
        api.get('/reports'),
        api.get('/prescriptions'),
        api.get('/appointments'),
        api.get('/symptoms/history')
      ]);

      const events = [];

      // Reports
      (resReports.data?.reports || []).forEach((r) => {
        events.push({
          id: r._id || r.id,
          type: 'report',
          title: `Lab Report: ${r.title}`,
          date: new Date(r.reportDate || r.createdAt),
          desc: `${r.originalFilename} • Risk: ${r.overallHealthRisk}`,
          link: '/reports'
        });
      });

      // Prescriptions
      (resPrescriptions.data?.prescriptions || []).forEach((p) => {
        events.push({
          id: p._id || p.id,
          type: 'prescription',
          title: `Prescription: ${p.title}`,
          date: new Date(p.prescriptionDate || p.createdAt),
          desc: `Prescribed by ${p.prescribingDoctor}`,
          link: '/prescriptions'
        });
      });

      // Appointments
      (resAppts.data?.appointments || []).forEach((a) => {
        events.push({
          id: a._id || a.id,
          type: 'appointment',
          title: `Consultation with ${a.doctor?.fullName || 'Physician'}`,
          date: new Date(a.appointmentDate),
          desc: `Status: ${a.status} (${a.consultationType}) • ${a.reasonForVisit}`,
          link: '/appointments'
        });
      });

      // Symptoms
      (resSymptoms.data?.history || []).forEach((s) => {
        events.push({
          id: s._id || s.id,
          type: 'symptom',
          title: `Symptom Check: ${s.symptomSummary?.slice(0, 40)}...`,
          date: new Date(s.createdAt),
          desc: `Concern: ${s.levelOfConcern} • Specialist: ${s.suggestedSpecialty}`,
          link: '/symptoms'
        });
      });

      // Sort chronological descending
      events.sort((a, b) => b.date - a.date);
      setTimeline(events);
    } catch (e) {
      toast.error('Failed to aggregate health history.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filterType === 'all'
    ? timeline
    : timeline.filter((e) => e.type === filterType);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-sky-600" /> Patient Longitudinal Health History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Chronological log of clinical consults, laboratory reports, prescription scans, and symptom assessments.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {['all', 'report', 'prescription', 'appointment', 'symptom'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg capitalize transition ${
                filterType === type
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Compiling longitudinal record...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          No medical records matching this filter.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 py-2">
          {filtered.map((item, idx) => {
            const isReport = item.type === 'report';
            const isRx = item.type === 'prescription';
            const isAppt = item.type === 'appointment';
            const isSym = item.type === 'symptom';

            return (
              <div key={idx} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[35px] sm:-left-[43px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-sm ${
                    isReport
                      ? 'bg-teal-500 ring-4 ring-white'
                      : isRx
                      ? 'bg-emerald-500 ring-4 ring-white'
                      : isAppt
                      ? 'bg-sky-500 ring-4 ring-white'
                      : 'bg-indigo-500 ring-4 ring-white'
                  }`}
                >
                  {isReport && <FileText className="w-3.5 h-3.5" />}
                  {isRx && <Pill className="w-3.5 h-3.5" />}
                  {isAppt && <Calendar className="w-3.5 h-3.5" />}
                  {isSym && <Stethoscope className="w-3.5 h-3.5" />}
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 transition flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <span className="text-[10px] font-semibold text-slate-400 capitalize px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                        {item.type}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">{item.desc}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  <Link
                    to={item.link}
                    className="p-2 text-slate-400 hover:text-sky-600 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
