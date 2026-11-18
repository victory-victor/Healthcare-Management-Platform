import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export default function MedicalDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-lg text-xs text-amber-800">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Medical Notice:</strong> AI guidance is educational only. It does not replace clinical diagnosis. Consult a physician for medical decisions.
        </span>
      </div>
    );
  }

  return (
    <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
      <div className="leading-relaxed">
        <strong className="text-slate-700 block mb-0.5">MedAI Nexus Clinical & Educational Disclaimer</strong>
        This application provides AI-assisted healthcare information and educational guidance. It does not provide medical diagnosis, treatment, or emergency services. AI-generated information may be inaccurate or incomplete. Always consult a qualified healthcare professional for medical decisions. In case of life-threatening emergency, call 911 immediately.
      </div>
    </div>
  );
}
