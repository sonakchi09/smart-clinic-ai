'use client';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function DoctorPage() {
  const { token, user, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [form, setForm] = useState({ consultationNotes: '', prescription: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [newPatientAlert, setNewPatientAlert] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const fetchPatients = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patients/my-patients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatients(res.data.patients);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!token || !user) return;

    fetchPatients();

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.emit('join-doctor-room', user.id);

    socket.on('new-patient', ({ patient }) => {
      setPatients((prev) => [...prev, patient]);
      setNewPatientAlert(`New patient: ${patient.name} (Token #${patient.tokenNumber})`);
      setTimeout(() => setNewPatientAlert(''), 5000);
    });

    socket.on('patient-updated', ({ patient }) => {
      setPatients((prev) =>
        prev.map((p) => (p._id === patient._id ? patient : p))
      );
      if (selectedPatient?._id === patient._id) {
        setSelectedPatient(patient);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const openPatient = (patient: any) => {
    setSelectedPatient(patient);
    setForm({
      consultationNotes: patient.consultationNotes || '',
      prescription: patient.prescription || ''
    });
    setSuccess('');
  };

  const handleSave = async (status: string) => {
    setSaving(true);
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patients/${selectedPatient._id}/consultation`,
        { ...form, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(status === 'done' ? 'Consultation marked as done!' : 'Notes saved!');
      setSelectedPatient(res.data.patient);
      fetchPatients();
    } catch (err) {
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      waiting: 'bg-yellow-50 text-yellow-700',
      'in-consultation': 'bg-blue-50 text-blue-700',
      done: 'bg-green-50 text-green-700'
    };
    const labels: Record<string, string> = {
      waiting: 'Waiting',
      'in-consultation': 'In Consultation',
      done: 'Done'
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-800">Smart Clinic AI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      {newPatientAlert && (
        <div className="bg-blue-600 text-white text-sm text-center py-2 font-medium">
          🔔 {newPatientAlert}
        </div>
      )}

      <div className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-3 gap-6">

        <div className="col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-gray-800">Today's Queue</h2>
            <button onClick={fetchPatients} className="text-xs text-blue-600 hover:text-blue-800">
              Refresh
            </button>
          </div>

          {patients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-gray-400 text-sm">No patients assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient._id}
                  onClick={() => openPatient(patient)}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition hover:border-blue-300 ${
                    selectedPatient?._id === patient._id ? 'border-blue-400 ring-1 ring-blue-300' : 'border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-blue-600 font-bold text-lg">#{patient.tokenNumber}</span>
                    {statusBadge(patient.status)}
                  </div>
                  <p className="text-gray-800 font-medium text-sm">{patient.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{patient.age} yrs • {patient.gender}</p>
                  <p className="text-gray-400 text-xs mt-1 truncate">{patient.symptoms}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2">
          {!selectedPatient ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-gray-400">Select a patient from the queue to start consultation</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{selectedPatient.name}</h2>
                  <p className="text-gray-500 text-sm">{selectedPatient.age} yrs • {selectedPatient.gender} • {selectedPatient.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-blue-600 font-bold text-2xl">#{selectedPatient.tokenNumber}</span>
                  <div className="mt-1">{statusBadge(selectedPatient.status)}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs font-medium text-gray-500 mb-1">Reported Symptoms</p>
                <p className="text-gray-800 text-sm">{selectedPatient.symptoms}</p>
              </div>

              {success && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Notes</label>
                  <textarea
                    value={form.consultationNotes}
                    onChange={(e) => setForm({ ...form, consultationNotes: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter diagnosis and notes..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
                  <textarea
                    value={form.prescription}
                    onChange={(e) => setForm({ ...form, prescription: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter medicines, dosage, instructions..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave('in-consultation')}
                    disabled={saving || selectedPatient.status === 'done'}
                    className="flex-1 border border-blue-500 text-blue-600 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Notes'}
                  </button>
                  <button
                    onClick={() => handleSave('done')}
                    disabled={saving || selectedPatient.status === 'done'}
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Mark as Done ✓'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}