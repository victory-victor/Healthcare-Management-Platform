import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  Pill,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ShieldCheck,
  Trash2,
  FileText,
  Check,
  X
} from 'lucide-react';

export default function PrescriptionScannerPage() {
  const toast = useToast();

  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState('');

  useEffect(() => {
    fetchPrescriptions();
    fetchReminders();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/prescriptions');
      if (res.data?.success) {
        setPrescriptions(res.data.prescriptions || []);
        if (res.data.prescriptions?.length > 0 && !selectedPrescription) {
          loadPrescriptionDetails(res.data.prescriptions[0]._id || res.data.prescriptions[0].id);
        }
      }
    } catch (e) {
      toast.error('Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await api.get('/prescriptions/reminders');
      if (res.data?.success) setReminders(res.data.reminders || []);
    } catch (e) {}
  };

  const loadPrescriptionDetails = async (id) => {
    try {
      const res = await api.get(`/prescriptions/${id}`);
      if (res.data?.success) {
        setSelectedPrescription(res.data.prescription);
        setMedicines(res.data.medicines || []);
      }
    } catch (e) {
      toast.error('Failed to load prescription medicines.');
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      toast.error('Please select a prescription file or enter prescription medication text.');
      return;
    }
    setScanning(true);

    const formData = new FormData();
    if (file) formData.append('prescriptionFile', file);
    if (rawText) formData.append('rawText', rawText.trim());

    try {
      const res = await api.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Prescription processed!');
        setFile(null);
        setRawText('');
        await fetchPrescriptions();
        await fetchReminders();
        loadPrescriptionDetails(res.data.prescription._id || res.data.prescription.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scanning failed.');
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateReminder = async (id, status) => {
    try {
      await api.put(`/prescriptions/reminders/${id}/status`, { status });
      toast.success(`Medication marked as ${status}!`);
      fetchReminders();
    } catch (e) {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await toast.confirm({
      title: 'Delete Prescription Record?',
      message: 'Are you sure you want to remove this prescription? Associated medication reminders and dosage schedules will also be removed.',
      confirmText: 'Remove Prescription',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      toast.success('Prescription removed.');
      setSelectedPrescription(null);
      setMedicines([]);
      fetchPrescriptions();
    } catch (e) {
      toast.error('Failed to delete prescription.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-600" /> AI Prescription Scanner & Medication Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture or upload prescriptions to extract dosage, timing, and food instructions with automated reminder alerts.
          </p>
        </div>
      </div>

      {/* Upload & Scan Form */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-600" /> Scan New Prescription Document or Image
        </h2>

        <form onSubmit={handleScan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Prescription Photo / PDF</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Paste Prescription Rx Notes (Optional)
              </label>
              <input
                type="text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="e.g. Amoxicillin 500mg tid, Pantoprazole 40mg od"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Prescriptions are never modified without pharmacist or physician sign-off.
            </span>

            <button
              type="submit"
              disabled={scanning || (!file && !rawText.trim())}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Extracting Medicines via OCR...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" /> Scan & Schedule Medication
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Medication Reminder Tracker Ribbon */}
      {reminders.length > 0 && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Daily Medication Reminders ({reminders.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {reminders.map((rem) => (
              <div
                key={rem._id || rem.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">{rem.medicineName}</div>
                  <div className="text-[11px] text-slate-500">{rem.dosage} • {rem.timeOfDay}</div>
                </div>

                {rem.statusToday === 'taken' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> Taken
                  </span>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleUpdateReminder(rem._id || rem.id, 'taken')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      Take
                    </button>
                    <button
                      onClick={() => handleUpdateReminder(rem._id || rem.id, 'skipped')}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition"
                    >
                      Skip
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescriptions List & Extracted Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Prescriptions List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Prescription Records ({prescriptions.length})
          </div>

          {prescriptions.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No prescriptions uploaded yet.
            </div>
          ) : (
            prescriptions.map((p) => (
              <div
                key={p._id || p.id}
                onClick={() => loadPrescriptionDetails(p._id || p.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  (selectedPrescription?._id || selectedPrescription?.id) === (p._id || p.id)
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[190px]">{p.title}</div>
                  <div className="text-[10px] text-slate-400">
                    Doctor: {p.prescribingDoctor} • {new Date(p.prescriptionDate || p.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p._id || p.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Right: Individual Medicine Cards */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedPrescription ? (
            <div className="h-64 bg-white rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center text-xs text-slate-400">
              Select an uploaded prescription on the left to review parsed medication cards.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{selectedPrescription.title}</h3>
                  <div className="text-xs text-slate-400">
                    Prescribed by: {selectedPrescription.prescribingDoctor}
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  {medicines.length} Medicines Identified
                </span>
              </div>

              {/* Medicine Cards Grid or Honest Empty State */}
              {medicines.length === 0 ? (
                <div className="p-8 bg-amber-50/60 border border-amber-200 rounded-2xl text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-bold text-amber-900">No Prescribed Medications Detected</h4>
                  <p className="text-xs text-amber-700 max-w-md mx-auto">
                    The AI scanned the provided file/text but did not identify any valid medication names or dosage schedules.
                    MedAI Nexus never fabricates dummy medications. Please upload a clear prescription photo or enter the medication names in the text field.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medicines.map((med) => (
                    <div
                      key={med._id || med.id}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-black text-slate-800">{med.medicineName}</h4>
                          {med.brandName && (
                            <div className="text-xs font-semibold text-sky-600">Brand: {med.brandName}</div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            med.confidenceFlag.includes('Verified')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {med.confidenceFlag}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Strength</span>
                          <span className="font-bold text-slate-800">{med.strength}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Dosage</span>
                          <span className="font-bold text-slate-800">{med.dosage}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Frequency</span>
                          <span className="font-semibold text-slate-700">{med.frequency}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duration</span>
                          <span className="font-semibold text-slate-700">{med.duration}</span>
                        </div>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-semibold text-slate-700">
                          Instructions: <span className="text-slate-500 font-normal">{med.instructions}</span>
                        </div>
                        <div className="inline-block text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                          Take: {med.beforeAfterFood}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
