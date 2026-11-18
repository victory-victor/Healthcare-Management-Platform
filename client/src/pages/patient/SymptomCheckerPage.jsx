import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  Stethoscope,
  AlertTriangle,
  ShieldAlert,
  Search,
  Plus,
  X,
  ArrowRight,
  Clock,
  Activity,
  History,
  Download,
  PhoneCall,
  UserCheck
} from 'lucide-react';

const COMMON_SYMPTOMS = [
  'Headache',
  'Fever',
  'Dry Cough',
  'Sore Throat',
  'Shortness of Breath',
  'Chest Pain',
  'Fatigue',
  'Nausea',
  'Abdominal Pain',
  'Diarrhea',
  'Dizziness',
  'Joint Pain',
  'Back Pain',
  'Skin Rash',
  'Loss of Appetite',
  'Muscle Aches',
  'Runny Nose',
  'Acid Reflux'
];

export default function SymptomCheckerPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [duration, setDuration] = useState('1-3 days');
  const [severity, setSeverity] = useState('moderate');
  const [frequency, setFrequency] = useState('Constant');
  const [age, setAge] = useState(30);

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/symptoms/history');
      if (res.data?.success) setHistory(res.data.history || []);
    } catch (e) {}
  };

  const addSymptom = (sym) => {
    if (!selectedSymptoms.includes(sym)) {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
    setCustomSymptom('');
    setSearchTerm('');
  };

  const removeSymptom = (sym) => {
    setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      toast.error('Please select or enter at least one symptom.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/symptoms/analyze', {
        symptoms: selectedSymptoms,
        duration,
        severity,
        frequency,
        age: Number(age)
      });

      if (res.data?.success) {
        setAnalysisResult(res.data.result);
        if (res.data.result?.isEmergency) {
          toast.alert({
            title: 'Urgent Red-Flag Emergency Detected',
            message: res.data.result.emergencyInstructions || 'Your reported symptoms suggest a potentially life-threatening medical emergency. Please contact emergency services (call 911 or local emergency) or go to the nearest hospital emergency room immediately.',
            type: 'danger',
            buttonText: 'I Understand & Will Seek Emergency Care'
          });
        } else {
          toast.success('Symptom analysis completed.');
        }
        fetchHistory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCommon = COMMON_SYMPTOMS.filter(
    (s) => s.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedSymptoms.includes(s)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-sky-600" /> AI Symptom Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical context triage with evidence-based possibilities, warning flags, and medical specialty guidance.
          </p>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition"
        >
          <History className="w-3.5 h-3.5" />
          {showHistory ? 'Back to Analysis' : `View Past History (${history.length})`}
        </button>
      </div>

      {showHistory ? (
        /* History View */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Previous Symptom Assessments</h2>
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No symptom assessments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item._id || item.id}
                  onClick={() => {
                    setAnalysisResult(item);
                    setShowHistory(false);
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{item.symptomSummary}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.levelOfConcern === 'Emergency'
                            ? 'bg-rose-100 text-rose-700'
                            : item.levelOfConcern === 'High'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.levelOfConcern} Concern
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Evaluated on {new Date(item.createdAt).toLocaleDateString()} • Suggested Specialist: {item.suggestedSpecialty}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Checker & Results Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form Column */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Step 1: Report Symptoms
            </h2>

            {/* Selected Symptoms Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Active Symptoms ({selectedSymptoms.length})
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {selectedSymptoms.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">Select from common list below or type to add</span>
                ) : (
                  selectedSymptoms.map((sym) => (
                    <span
                      key={sym}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-100 rounded-lg"
                    >
                      {sym}
                      <button
                        type="button"
                        onClick={() => removeSymptom(sym)}
                        className="hover:text-rose-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customSymptom.trim()) addSymptom(customSymptom.trim());
                  }
                }}
                placeholder="Type custom symptom..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customSymptom.trim()) addSymptom(customSymptom.trim());
                }}
                className="px-3 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold hover:bg-sky-100 transition"
              >
                Add
              </button>
            </div>

            {/* Searchable Common Symptoms */}
            <div>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter common clinical symptoms..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {filteredCommon.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => addSymptom(sym)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 rounded-lg transition"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Context Parameters */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Less than 24 hours">Less than 24 hours</option>
                  <option value="1-3 days">1-3 days</option>
                  <option value="4-7 days">4-7 days</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="More than 2 weeks">More than 2 weeks</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="mild">Mild (Noticeable)</option>
                  <option value="moderate">Moderate (Interfering)</option>
                  <option value="severe">Severe (Disabling)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Constant">Constant</option>
                  <option value="Intermittent">Intermittent / Fluctuating</option>
                  <option value="Occasional">Occasional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || selectedSymptoms.length === 0}
              className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing Symptoms with Clinical Engine...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" /> Run AI Clinical Analysis
                </>
              )}
            </button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 space-y-4">
            {!analysisResult ? (
              <div className="h-full min-h-[350px] bg-white rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">No Active Analysis Loaded</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Select your active symptoms on the left and submit to generate a structured non-diagnostic clinical guidance report.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 animate-fade-in">
                {/* Emergency Alert Banner if Triggered */}
                {analysisResult.isEmergency && (
                  <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 space-y-2">
                    <div className="flex items-center gap-2 font-black text-rose-700 uppercase tracking-wider">
                      <PhoneCall className="w-4 h-4" /> Urgent Red-Flag Emergency Detected
                    </div>
                    <p className="leading-relaxed font-semibold">
                      {analysisResult.emergencyInstructions || 'Please immediately contact emergency medical services (911) or visit the nearest emergency department.'}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Analysis Summary</span>
                    <h3 className="text-sm font-bold text-slate-800">Clinical Triage Evaluation</h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      analysisResult.levelOfConcern === 'Emergency'
                        ? 'bg-rose-100 text-rose-800'
                        : analysisResult.levelOfConcern === 'High'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Concern: {analysisResult.levelOfConcern}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {analysisResult.symptomSummary}
                </p>

                {/* Educational Conditions Possibilities */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">
                    Educational Possibilities (Non-Diagnostic)
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.potentialConditions?.map((cond, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{cond.condition}</span>
                          <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                            Probability: {cond.probability}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{cond.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning Signs */}
                {analysisResult.warningSigns?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Warning Signs to Watch
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                      {analysisResult.warningSigns.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Specialty & Action */}
                <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-sky-600 uppercase">Suggested Medical Specialty</span>
                      <div className="text-sm font-bold text-sky-950">{analysisResult.suggestedSpecialty}</div>
                    </div>
                    <Link
                      to={`/doctors?specialty=${encodeURIComponent(analysisResult.suggestedSpecialty)}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Find {analysisResult.suggestedSpecialty}
                    </Link>
                  </div>
                  <p className="text-[11px] text-slate-600 pt-1">
                    <strong>When to consult:</strong> {analysisResult.whenToConsultDoctor}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
