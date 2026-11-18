import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Public Auth Pages
import LandingPage from '../pages/auth/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Patient Module Pages
import DashboardPage from '../pages/patient/DashboardPage';
import SymptomCheckerPage from '../pages/patient/SymptomCheckerPage';
import MedicalReportsPage from '../pages/patient/MedicalReportsPage';
import PrescriptionScannerPage from '../pages/patient/PrescriptionScannerPage';
import DietPlannerPage from '../pages/patient/DietPlannerPage';
import FindDoctorsPage from '../pages/patient/FindDoctorsPage';
import AppointmentsPage from '../pages/patient/AppointmentsPage';
import ChatbotPage from '../pages/patient/ChatbotPage';
import HealthHistoryPage from '../pages/patient/HealthHistoryPage';
import ProfilePage from '../pages/patient/ProfilePage';
import PrivacySecurityPage from '../pages/patient/PrivacySecurityPage';

// Specialist & Admin Pages
import DoctorDashboardPage from '../pages/doctor/DoctorDashboardPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Patient & Clinical Modules */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Patient Only Modules */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/symptoms"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <SymptomCheckerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MedicalReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PrescriptionScannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diet"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DietPlannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <FindDoctorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <ChatbotPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <HealthHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/privacy" element={<PrivacySecurityPage />} />

        {/* Doctor Dedicated Clinical Portal & Sub-Modules */}
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <DoctorDashboardPage activeTab="overview" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <DoctorDashboardPage activeTab="appointments" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <DoctorDashboardPage activeTab="patients" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <DoctorDashboardPage activeTab="prescriptions" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/schedule"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <DoctorDashboardPage activeTab="schedule" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <DoctorDashboardPage activeTab="profile" />
            </ProtectedRoute>
          }
        />

        {/* Admin Center */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
