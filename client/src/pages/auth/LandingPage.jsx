import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Stethoscope,
  FileText,
  Pill,
  Utensils,
  Bot,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Lock,
  Activity
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: 'AI Symptom Analysis',
      desc: 'Context-aware symptom triage offering structured educational possibilities and emergency red-flag detection.',
      icon: Stethoscope,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      title: 'Medical Report OCR',
      desc: 'Instant parameter extraction from laboratory PDFs and images with reference range flags and plain-language summaries.',
      icon: FileText,
      color: 'bg-teal-50 text-teal-600 border-teal-100',
    },
    {
      title: 'Prescription Scanner',
      desc: 'Automatic medication dosage, schedule extraction, and reminder tracking with pharmacist verification indicators.',
      icon: Pill,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Personalized Nutrition Planner',
      desc: 'AI-tailored 7-day meal plans respecting allergies, health conditions, macro targets, and hydration goals.',
      icon: Utensils,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: 'Doctor Directory & Booking',
      desc: 'Discover verified medical specialists by specialty, fee, and location with atomic slot booking.',
      icon: Activity,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: '24/7 AI Health Assistant',
      desc: 'Conversational assistant with authorized medical context to guide your healthcare questions safely.',
      icon: Bot,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 bg-clip-text text-transparent">
                MedAI Nexus
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Healthcare Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-sky-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 rounded-xl shadow-sm transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Emergency Alert Banner */}
      <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-center text-xs text-rose-800 font-medium flex items-center justify-center gap-2">
        <PhoneCall className="w-4 h-4 text-rose-600 shrink-0" />
        <span>In an acute life-threatening emergency, always dial <strong>911</strong> or visit the nearest emergency room immediately.</span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-700 shadow-sm">
            <Sparkles className="w-4 h-4 text-sky-500" />
            Next-Generation AI Precision Healthcare Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Intelligent Health Management, <br />
            <span className="bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">
              Simplified & Secured.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
            MedAI Nexus brings together symptom analysis, medical report OCR extraction, smart prescription scheduling, customized nutrition planning, and verified doctor appointments into one secure platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Start Free Patient Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Comprehensive Clinical Ecosystem</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Engineered with strict clinical safety standards, HIPAA/DPDP principles, and evidence-based AI reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 space-y-3"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${f.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security & Privacy Highlights */}
      <section className="py-16 bg-white border-y border-slate-200 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center shrink-0">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-xl font-bold text-slate-900">Privacy, Security & Data Sovereignty First</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every medical report and symptom assessment is stored with role-based access isolation. MedAI Nexus does not share protected health information with third parties without explicit user consent. Full DSAR data portability export is available with one click.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> End-to-End Encryption</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Role-Based Access Control</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complete Audit Logging</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-slate-400">
        <p>© 2026 MedAI Nexus Healthcare Technologies. All rights reserved.</p>
        <p className="mt-1">
          Medical guidance is educational only. Always consult a licensed clinical physician for diagnosis and prescription changes.
        </p>
      </footer>
    </div>
  );
}
