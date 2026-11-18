import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  ShieldCheck,
  Lock,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  Activity,
  Trash2
} from 'lucide-react';

export default function PrivacySecurityPage() {
  const { logout } = useAuth();
  const toast = useToast();

  const [consents, setConsents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  const fetchPrivacyData = async () => {
    try {
      setLoading(true);
      const [resConsents, resLogs] = await Promise.all([
        api.get('/privacy/consents'),
        api.get('/privacy/audit-logs')
      ]);

      if (resConsents.data?.success) setConsents(resConsents.data.consents || []);
      if (resLogs.data?.success) setAuditLogs(resLogs.data.logs || []);
    } catch (e) {
      toast.error('Failed to load privacy settings.');
    } finally {
      setLoading(false);
    }
  };

  const toggleConsent = async (type, currentVal) => {
    try {
      const res = await api.put('/privacy/consents', {
        consentType: type,
        isGranted: !currentVal
      });

      if (res.data?.success) {
        toast.success(`Consent preferences updated.`);
        setConsents((prev) =>
          prev.map((c) =>
            c.consentType === type ? { ...c, isGranted: !currentVal } : c
          )
        );
      }
    } catch (e) {
      toast.error('Failed to update consent.');
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await api.get('/privacy/export-data');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `medai_nexus_personal_medical_records.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Complete personal medical records archive downloaded (DSAR compliant).');
    } catch (e) {
      toast.error('Failed to export data archive.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await toast.confirm({
      title: 'Exercise Right to Erasure (Delete Account)?',
      message: 'Are you sure you want to permanently delete your medical account and all associated health records?\n\nThis will permanently purge your profile, medical reports, prescriptions, reminders, symptom analyses, diet plans, and appointments.',
      confirmText: 'Erase All My Data',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await api.delete('/auth/account');
      toast.success('Your account and all associated medical data have been permanently erased.');
      logout();
    } catch (e) {
      toast.error('Failed to erase account data.');
    }
  };

  const consentLabels = {
    medical_data_processing: {
      title: 'Clinical Data Processing',
      desc: 'Allow MedAI Nexus to store and process your biomarker tests, prescriptions, and health metrics securely.'
    },
    ai_analysis: {
      title: 'AI Assisted Diagnostic Analysis',
      desc: 'Enable AI natural language algorithms to evaluate symptoms and generate dietary and medication insights.'
    },
    notifications: {
      title: 'In-App Notifications & Reminders',
      desc: 'Permit in-app alerts and dashboard notifications for scheduled medication reminders and doctor appointments.'
    },
    telehealth_terms: {
      title: 'Virtual Telehealth Terms',
      desc: 'Agreement to remote clinical consultation video sessions with licensed medical specialists.'
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-600" /> Patient Privacy & Security Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your granular consent preferences, review immutable audit trails, and export your personal health data archive.
          </p>
        </div>
      </div>

      {/* Regulatory & Medical Compliance Statement */}
      <div className="p-6 bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-200 rounded-2xl shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Lock className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-sky-950 text-sm">Regulatory Alignment: DPDP & HIPAA Frameworks</div>
          <p className="text-slate-600 leading-relaxed">
            MedAI Nexus is architected following India's Digital Personal Data Protection Act (DPDP) and international healthcare security regulations (HIPAA/GDPR). All protected health data is isolated by user role, encrypted at rest and in transit, and never utilized for commercial model training without explicit consent.
          </p>
        </div>
      </div>

      {/* Consent Management Toggles */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-teal-600" /> Patient Consent & Processing Preferences
        </h2>

        <div className="divide-y divide-slate-100">
          {consents.map((c) => {
            const meta = consentLabels[c.consentType] || {
              title: c.consentType,
              desc: 'Platform feature consent'
            };
            return (
              <div key={c._id || c.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800">{meta.title}</div>
                  <div className="text-[11px] text-slate-500 max-w-lg">{meta.desc}</div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.isGranted}
                    onChange={() => toggleConsent(c.consentType, c.isGranted)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Portability (DSAR Export) */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Export Personal Medical Record Archive (DSAR)
          </h2>
          <p className="text-xs text-slate-500 max-w-lg">
            Download an exhaustive, machine-readable JSON copy of your entire patient record, including lab extractions, prescriptions, appointments, and vitals.
          </p>
        </div>

        <button
          onClick={handleExportData}
          disabled={exporting}
          className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-sky-700 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-sky-600" />
          {exporting ? 'Compiling Archive...' : 'Download My Data'}
        </button>
      </div>

      {/* Security Audit Log */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" /> Personal Account Security & Access Audit Trail
          </h2>
          <span className="text-[10px] text-slate-400">Recent {auditLogs.length} events</span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No recent security events logged.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100">
            {auditLogs.map((log) => (
              <div key={log._id || log.id} className="p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{log.action.replace(/_/g, ' ')}</span>
                  <div className="text-[11px] text-slate-400">
                    Resource: {log.resource} • IP: {log.ipAddress}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {log.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permanent Account Deletion / Right to Erasure */}
      <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" /> Permanent Account Erasure (Right to be Forgotten)
          </h2>
          <p className="text-xs text-rose-700 max-w-lg">
            Permanently delete your account and erase all associated personal medical records, diagnostic reports, prescriptions, reminders, and health history.
          </p>
        </div>

        <button
          onClick={handleDeleteAccount}
          className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition flex items-center gap-2 shrink-0"
        >
          <Trash2 className="w-4 h-4" /> Delete Account & All Data
        </button>
      </div>
    </div>
  );
}
