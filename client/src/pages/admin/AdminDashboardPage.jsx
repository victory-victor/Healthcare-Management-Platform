import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  ShieldAlert,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Lock,
  Plus
} from 'lucide-react';

export default function AdminDashboardPage() {
  const toast = useToast();

  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Specialty form
  const [specName, setSpecName] = useState('');
  const [specDesc, setSpecDesc] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [resStats, resUsers, resDoctors, resLogs] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/doctors'),
        api.get('/admin/audit-logs')
      ]);

      if (resStats.data?.success) setStats(resStats.data.stats || {});
      if (resUsers.data?.success) setUsers(resUsers.data.users || []);
      if (resDoctors.data?.success) setDoctors(resDoctors.data.doctors || []);
      if (resLogs.data?.success) setAuditLogs(resLogs.data.logs || []);
    } catch (e) {
      toast.error('Failed to load admin telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDoctorVerify = async (doctorId, currentStatus) => {
    try {
      await api.put(`/admin/doctors/${doctorId}/verify`, { isVerified: !currentStatus });
      toast.success('Doctor verification status updated.');
      fetchAdminData();
    } catch (e) {
      toast.error('Failed to update doctor verification.');
    }
  };

  const handleAddSpecialty = async (e) => {
    e.preventDefault();
    if (!specName) return;
    try {
      await api.post('/admin/specialties', { name: specName, description: specDesc });
      toast.success(`Specialty '${specName}' added successfully!`);
      setSpecName('');
      setSpecDesc('');
    } catch (e) {
      toast.error('Failed to add specialty.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600" /> Platform Administration Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervise clinical accounts, verify licensed doctor credentials, and audit healthcare data operations.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-800">
          <Lock className="w-3.5 h-3.5" />
          <span>Role: Platform Administrator</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Patients</span>
          <span className="text-2xl font-black text-slate-900">{stats.totalPatients || 0}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-500 block">Active Specialists</span>
          <span className="text-2xl font-black text-teal-600">{stats.totalDoctors || 0}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500 block">Total Consultations</span>
          <span className="text-2xl font-black text-sky-600">{stats.totalAppointments || 0}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 block">Processed Reports</span>
          <span className="text-2xl font-black text-purple-600">{stats.totalReports || 0}</span>
        </div>
      </div>

      {/* Doctor Verification Management */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" /> Doctor Licensing & Credential Verification
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Physician</th>
                <th className="py-2.5 px-3">Specialty</th>
                <th className="py-2.5 px-3">License Reg</th>
                <th className="py-2.5 px-3">Hospital</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map((doc) => (
                <tr key={doc._id || doc.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-bold text-slate-800">{doc.fullName}</td>
                  <td className="py-3 px-3 text-sky-700 font-semibold">{doc.specialty}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{doc.registrationNumber}</td>
                  <td className="py-3 px-3 text-slate-600">{doc.hospital}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.isVerified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {doc.isVerified ? 'Verified Active' : 'Unverified / Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleDoctorVerify(doc._id || doc.id, doc.isVerified)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        doc.isVerified
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {doc.isVerified ? 'Revoke License' : 'Verify Credentials'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column: Users List & Add Specialty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Accounts */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" /> Platform User Accounts ({users.length})
          </h2>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {users.map((u) => (
              <div key={u.id} className="p-2.5 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{u.name}</div>
                  <div className="text-[11px] text-slate-400">{u.email}</div>
                </div>
                <span className="capitalize font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px]">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Add Specialty Form */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-600" /> Add Clinical Specialty
          </h2>

          <form onSubmit={handleAddSpecialty} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty Name</label>
              <input
                type="text"
                required
                value={specName}
                onChange={(e) => setSpecName(e.target.value)}
                placeholder="e.g. Pulmonologist"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={specDesc}
                onChange={(e) => setSpecDesc(e.target.value)}
                placeholder="Clinical scope and disorders treated..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Add Medical Specialty
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
