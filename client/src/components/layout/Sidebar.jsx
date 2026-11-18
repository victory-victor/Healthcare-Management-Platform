import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Stethoscope,
  FileText,
  Pill,
  Utensils,
  UserCheck,
  Calendar,
  Bot,
  History,
  ShieldCheck,
  LogOut,
  User,
  Settings,
  HeartPulse,
  Activity,
  ShieldAlert,
  Users,
  FileCheck,
  Clock,
  Briefcase
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Patient Navigation Items
  const patientNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Symptom Analysis', path: '/symptoms', icon: Stethoscope },
    { name: 'Medical Reports', path: '/reports', icon: FileText },
    { name: 'Prescription Scanner', path: '/prescriptions', icon: Pill },
    { name: 'Diet Planner', path: '/diet', icon: Utensils },
    { name: 'Find Doctors', path: '/doctors', icon: UserCheck },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
    { name: 'AI Health Assistant', path: '/chat', icon: Bot },
    { name: 'Health History', path: '/history', icon: History },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Privacy & Security', path: '/privacy', icon: ShieldCheck },
  ];

  // Doctor Navigation Items (Exclusively Doctor Clinical Functions)
  const doctorNavItems = [
    { name: 'Clinical Overview', path: '/doctor-dashboard', icon: Activity },
    { name: 'Patient Consultations', path: '/doctor/appointments', icon: Calendar },
    { name: 'Patient Health Records', path: '/doctor/patients', icon: Users },
    { name: 'Write Digital Rx', path: '/doctor/prescriptions', icon: FileCheck },
    { name: 'Schedule & Hours', path: '/doctor/schedule', icon: Clock },
    { name: 'Practice Profile', path: '/doctor/profile', icon: Briefcase },
    { name: 'Audit & Compliance', path: '/privacy', icon: ShieldCheck },
  ];

  // Admin Navigation Items
  const adminNavItems = [
    { name: 'Admin Dashboard', path: '/admin-dashboard', icon: ShieldAlert },
    { name: 'Audit & Compliance', path: '/privacy', icon: ShieldCheck },
  ];

  // Select active nav list based on user role
  const activeNavItems =
    user?.role === 'doctor'
      ? doctorNavItems
      : user?.role === 'admin'
      ? adminNavItems
      : patientNavItems;

  const sectionHeading =
    user?.role === 'doctor'
      ? 'Specialist Clinical Suite'
      : user?.role === 'admin'
      ? 'System Administration'
      : 'Clinical Modules';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-200">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white shadow-md shadow-sky-500/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <span className="text-base font-bold bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 bg-clip-text text-transparent">
              MedAI Nexus
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              {user?.role === 'doctor' ? 'Provider Portal' : user?.role === 'admin' ? 'Admin Center' : 'Precision Health'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            {sectionHeading}
          </div>

          {activeNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path + item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? user?.role === 'doctor'
                        ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-100 shadow-sm'
                        : user?.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-100 shadow-sm'
                        : 'bg-sky-50 text-sky-700 font-semibold border border-sky-100 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    user?.role === 'doctor'
                      ? 'text-teal-600'
                      : user?.role === 'admin'
                      ? 'text-purple-600'
                      : 'text-sky-600'
                  }`}
                />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-500">
            <span>Role:</span>
            <span
              className={`capitalize font-semibold px-2 py-0.5 rounded-full border ${
                user?.role === 'doctor'
                  ? 'text-teal-700 bg-teal-50 border-teal-200'
                  : user?.role === 'admin'
                  ? 'text-purple-700 bg-purple-50 border-purple-200'
                  : 'text-sky-700 bg-sky-50 border-sky-200'
              }`}
            >
              {user?.role === 'doctor' ? 'Physician' : user?.role || 'Patient'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
