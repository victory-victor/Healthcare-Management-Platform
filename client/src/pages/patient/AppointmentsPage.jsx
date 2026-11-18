import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  Calendar,
  Clock,
  Video,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Plus
} from 'lucide-react';

export default function AppointmentsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(Boolean(searchParams.get('doctor')));

  // Form states
  const [selectedDoctorId, setSelectedDoctorId] = useState(searchParams.get('doctor') || '');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [consultationType, setConsultationType] = useState('online');
  const [reason, setReason] = useState('General Consultation');

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      if (res.data?.success) setAppointments(res.data.appointments || []);
    } catch (e) {
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      if (res.data?.success) {
        setDoctors(res.data.doctors || []);
        if (!selectedDoctorId && res.data.doctors?.length > 0) {
          setSelectedDoctorId(res.data.doctors[0]._id || res.data.doctors[0].id);
        }
      }
    } catch (e) {}
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !appointmentDate || !timeSlot) {
      toast.error('Please fill in all appointment fields.');
      return;
    }

    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        doctorId: selectedDoctorId,
        appointmentDate,
        timeSlot,
        consultationType,
        reasonForVisit: reason
      });

      if (res.data?.success) {
        toast.success('Appointment successfully scheduled!');
        setShowBookingModal(false);
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id) => {
    const confirmed = await toast.confirm({
      title: 'Cancel Appointment?',
      message: 'Are you sure you want to cancel this scheduled consultation? The doctor and clinic will be notified.',
      confirmText: 'Cancel Appointment',
      type: 'warning'
    });
    if (!confirmed) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment cancelled.');
      fetchAppointments();
    } catch (e) {
      toast.error('Failed to cancel appointment.');
    }
  };

  const selectedDoctorObj = doctors.find(
    (d) => String(d._id || d.id) === String(selectedDoctorId)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-600" /> Doctor Appointment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Book consultations with verified physicians, prevent double-bookings, and access virtual video consultation links.
          </p>
        </div>

        <button
          onClick={() => setShowBookingModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Book New Appointment
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Scheduled Appointments ({appointments.length})
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No appointments scheduled</div>
            <p className="text-xs text-slate-400">Click "Book New Appointment" to schedule a consultation with a specialist.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt._id || appt.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-200 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    {appt.consultationType === 'online' ? <Video className="w-6 h-6" /> : <Building className="w-6 h-6" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800">{appt.doctor?.fullName || 'Specialist'}</h3>
                      <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                        {appt.doctor?.specialty || 'General'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(appt.appointmentDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {appt.timeSlot}
                      </span>
                      <span className="capitalize font-semibold text-slate-700">
                        Type: {appt.consultationType}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 italic">Reason: {appt.reasonForVisit}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      appt.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : appt.status === 'completed'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {appt.status}
                  </span>

                  {appt.status === 'confirmed' && appt.consultationType === 'online' && (
                    <a
                      href={appt.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Room
                    </a>
                  )}

                  {appt.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(appt._id || appt.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Schedule Doctor Consultation</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>

            <form onSubmit={handleBook} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  {doctors.map((d) => (
                    <option key={d._id || d.id} value={d._id || d.id}>
                      {d.fullName} ({d.specialty}) — ${d.consultationFees}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    {(selectedDoctorObj?.availableSlots || [
                      '09:00 AM',
                      '10:30 AM',
                      '11:30 AM',
                      '02:00 PM',
                      '03:30 PM',
                      '04:30 PM'
                    ]).map((slot, sIdx) => (
                      <option key={sIdx} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 ${
                      consultationType === 'online'
                        ? 'bg-sky-50 border-sky-300 text-sky-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={consultationType === 'online'}
                      onChange={() => setConsultationType('online')}
                      className="hidden"
                    />
                    <Video className="w-4 h-4 text-sky-600" />
                    <span>Telehealth Video</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 ${
                      consultationType === 'offline'
                        ? 'bg-sky-50 border-sky-300 text-sky-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={consultationType === 'offline'}
                      onChange={() => setConsultationType('offline')}
                      className="hidden"
                    />
                    <Building className="w-4 h-4 text-teal-600" />
                    <span>In-Person Clinic</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your health concern..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {booking ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
