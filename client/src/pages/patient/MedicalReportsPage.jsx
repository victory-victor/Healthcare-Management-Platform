import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Download,
  Trash2,
  HelpCircle,
  Eye,
  FileCheck,
  Info,
  Activity
} from 'lucide-react';

export default function MedicalReportsPage() {
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [extractedValues, setExtractedValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportText, setReportText] = useState('');
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      if (res.data?.success) {
        setReports(res.data.reports || []);
        if (res.data.reports?.length > 0 && !selectedReport) {
          loadReportDetails(res.data.reports[0]._id || res.data.reports[0].id);
        }
      }
    } catch (e) {
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const loadReportDetails = async (id) => {
    try {
      const res = await api.get(`/reports/${id}`);
      if (res.data?.success) {
        setSelectedReport(res.data.report);
        setExtractedValues(res.data.extractedValues || []);
      }
    } catch (e) {
      toast.error('Failed to load report parameters.');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file && !reportText.trim()) {
      toast.error('Please select a PDF/image report file OR enter laboratory test text.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    if (file) {
      formData.append('reportFile', file);
    }
    if (reportText.trim()) {
      formData.append('reportText', reportText.trim());
    }
    formData.append('title', reportTitle || (file ? file.name : `Lab Report - ${new Date().toLocaleDateString()}`));

    try {
      const res = await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Report analyzed successfully!');
        setFile(null);
        setReportTitle('');
        setReportText('');
        await fetchReports();
        loadReportDetails(res.data.report._id || res.data.report.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await toast.confirm({
      title: 'Delete Diagnostic Report?',
      message: 'Are you sure you want to permanently delete this diagnostic laboratory report and all its extracted biomarker parameters? This action cannot be undone.',
      confirmText: 'Delete Report',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Report deleted.');
      setSelectedReport(null);
      setExtractedValues([]);
      fetchReports();
    } catch (e) {
      toast.error('Failed to delete report.');
    }
  };

  const downloadJSON = () => {
    if (!selectedReport) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      report: selectedReport,
      extractedValues
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${selectedReport.title}_extracted_values.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" /> Medical Report OCR & Lab Extraction
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload blood work, lipid panels, or diagnostic summaries for parameter extraction and clinical explanations.
          </p>
        </div>
      </div>

      {/* Educational Card: What are Biomarker Test Parameters? */}
      {showInfo && (
        <div className="p-4 bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50 border border-teal-200 rounded-2xl relative shadow-sm">
          <button
            onClick={() => setShowInfo(false)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-teal-600 text-white rounded-xl mt-0.5">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1 pr-6">
              <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-teal-700" /> What does Biomarker Test Parameters do?
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Biomarkers</strong> are measurable clinical parameters in your diagnostic lab tests (such as <strong>Hemoglobin, Fasting Blood Glucose, Total Cholesterol, Creatinine, TSH,</strong> etc.). 
                The AI reads your uploaded lab report or pasted test results and extracts <strong>only the genuine values present in your document</strong>. It compares them against standard medical reference ranges to show whether they are normal or require doctor attention. 
                <span className="block mt-1 font-semibold text-teal-900">
                  🛡️ Strict Medical Safety: MedAI Nexus never invents or generates fake biomarker values. If no test parameters are found in your document, it will not fabricate any numbers.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Box */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-teal-600" /> Upload Diagnostic Report or Enter Lab Results
        </h2>

        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Report Title / Description</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. Annual Metabolic Panel or Lipid Profile"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Document File (PDF / JPG / PNG)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Or Paste Lab Test Results Directly (Optional)
            </label>
            <textarea
              rows={3}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="e.g. Hemoglobin: 14.5 g/dL, Fasting Blood Glucose: 98 mg/dL, Total Cholesterol: 195 mg/dL, Serum Creatinine: 0.9 mg/dL..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              {file ? `Selected file: ${file.name}` : 'No file selected (you can upload a file or paste text)'}
            </span>

            <button
              type="submit"
              disabled={uploading || (!file && !reportText.trim())}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing Report via Gemini AI...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" /> Scan & Extract Biomarkers
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Two Column Layout: Report List on Left, Active Report Dashboard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Previous Reports */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Uploaded Reports ({reports.length})
          </div>

          {reports.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No reports uploaded yet.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep._id || rep.id}
                onClick={() => loadReportDetails(rep._id || rep.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  (selectedReport?._id || selectedReport?.id) === (rep._id || rep.id)
                    ? 'bg-teal-50/70 border-teal-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[190px]">{rep.title}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(rep.reportDate || rep.createdAt).toLocaleDateString()} • {rep.originalFilename}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(rep._id || rep.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                  title="Delete report"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Right: Extracted Biomarkers Table & AI Insights */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedReport ? (
            <div className="h-64 bg-white rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center text-xs text-slate-400">
              Select an uploaded report on the left or upload a new one to inspect its parameters.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedReport.title}</h3>
                  <div className="text-xs text-slate-400">
                    Document: {selectedReport.originalFilename} • Risk Level: 
                    <span className={`ml-1 font-bold ${
                      selectedReport.overallHealthRisk === 'Normal' ? 'text-emerald-600' :
                      selectedReport.overallHealthRisk === 'Attention Needed' ? 'text-amber-600' :
                      selectedReport.overallHealthRisk === 'Critical Attention' ? 'text-rose-600' : 'text-slate-500'
                    }`}>
                      {selectedReport.overallHealthRisk || 'Analyzed'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadJSON}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Data
                  </button>
                </div>
              </div>

              {/* AI Clinical Summary Banner */}
              {selectedReport.aiSummary && (
                <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-teal-900">AI Clinical Interpretation</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedReport.aiSummary}</p>
                </div>
              )}

              {/* Extracted Parameters Table or Clean Empty State */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Biomarker Test Parameters ({extractedValues.length})
                </h4>

                {extractedValues.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">No Biomarker Parameters Detected</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      No recognized clinical test parameters (e.g. Hemoglobin, Glucose, Cholesterol, Creatinine) were found in this document. 
                      MedAI Nexus does not fabricate fake numbers. You can paste your test numbers in the text box above to analyze them.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Test Parameter</th>
                          <th className="py-2.5 px-3">Value</th>
                          <th className="py-2.5 px-3">Reference Range</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Educational Meaning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extractedValues.map((v) => (
                          <tr key={v._id || v.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{v.parameter}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {v.value} {v.unit}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{v.referenceRange}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  v.status === 'Normal'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : v.status === 'Above reference range'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {v.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs">{v.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Questions for Doctor */}
              {selectedReport.doctorQuestions?.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-sky-600" /> Recommended Questions for Your Doctor
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                    {selectedReport.doctorQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
