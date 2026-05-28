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
  const [recording, setRecording] = useState(false);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [transcript, setTranscript] = useState('');
const [transcribing, setTranscribing] = useState(false);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
const [aiSummary, setAiSummary] = useState('');
const [summaryLoading, setSummaryLoading] = useState(false);

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    setRecording(true);
    setTranscript('');
    setAudioBlob(null);
  } catch (err) {
    console.log('Microphone error:', err);
    alert('Could not access microphone. Please allow microphone permission.');
  }
};

const stopRecording = () => {
  if (mediaRecorderRef.current && recording) {
    mediaRecorderRef.current.stop();
    setRecording(false);
  }
};
const sendAudioForTranscription = async () => {
  if (!audioBlob) return;
  setTranscribing(true);
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/transcribe`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    const { transcript: text, structured } = res.data;
    setTranscript(text);

    if (structured) {
      setForm({
        consultationNotes: structured.diagnosis + '\n\nInstructions: ' + structured.instructions,
        prescription: structured.medicines + '\n\nFollow-up: ' + structured.followUp
      });
    }
  } catch (err) {
    console.log('Transcription error:', err);
    alert('Transcription failed. Please try again.');
  } finally {
    setTranscribing(false);
  }
};

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
  setAiSummary('');
  setTranscript('');
  setAudioBlob(null);
  fetchAiSummary(patient);
};
  const fetchAiSummary = async (patient: any) => {
  setSummaryLoading(true);
  setAiSummary('');
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/pre-consultation`,
      { patient },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setAiSummary(res.data.summary);
  } catch (err) {
    console.log(err);
  } finally {
    setSummaryLoading(false);
  }
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

          {patients.some(p => p.urgency === 'High' && p.status === 'waiting') && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
              <p className="text-red-700 text-xs font-medium">
                🚨 High urgency patient(s) in queue — please attend immediately
              </p>
            </div>
          )}

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
                    selectedPatient?._id === patient._id ? 'border-blue-400 ring-1 ring-blue-300' :
                    patient.urgency === 'High' ? 'border-red-300' : 'border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-blue-600 font-bold text-lg">#{patient.tokenNumber}</span>
                    <div className="flex gap-1">
                      {patient.urgency === 'High' && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-50 text-red-700">
                          🚨 High
                        </span>
                      )}
                      {patient.urgency === 'Medium' && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-50 text-yellow-700">
                          ⚠️ Medium
                        </span>
                      )}
                      {patient.urgency === 'Low' && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-50 text-green-700">
                          ✓ Low
                        </span>
                      )}
                      {statusBadge(patient.status)}
                    </div>
                  </div>
                  <p className="text-gray-800 font-medium text-sm">{patient.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{patient.age} yrs • {patient.gender}</p>
                  <p className="text-gray-400 text-xs mt-1 truncate">{patient.symptoms}</p>
                  {patient.suggestedDoctorType && (
                    <p className="text-blue-400 text-xs mt-1">AI: {patient.suggestedDoctorType}</p>
                  )}
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

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
  <p className="text-xs font-medium text-gray-500 mb-1">Reported Symptoms</p>
  <p className="text-gray-800 text-sm">{selectedPatient.symptoms}</p>
</div>

<div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
  <p className="text-xs font-medium text-purple-600 mb-2">🤖 AI Pre-Consultation Summary</p>
  {summaryLoading ? (
    <p className="text-xs text-purple-400 animate-pulse">Generating clinical summary...</p>
  ) : aiSummary ? (
    <p className="text-sm text-purple-800 leading-relaxed">{aiSummary}</p>
  ) : (
    <p className="text-xs text-purple-400">Summary will appear here</p>
  )}
</div>

              {success && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
                  {success}
                </div>
              )}

             <div className="bg-gray-50 rounded-xl p-4">
  <p className="text-xs font-medium text-gray-500 mb-3">Voice to Prescription</p>
  <div className="flex items-center gap-3">
    {!recording ? (
      <button
        onClick={startRecording}
        disabled={selectedPatient?.status === 'done'}
        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
      >
        🎤 Start Recording
      </button>
    ) : (
      <button
        onClick={stopRecording}
        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition animate-pulse"
      >
        ⏹ Stop Recording
      </button>
    )}
    {recording && (
      <span className="text-red-500 text-xs font-medium animate-pulse">
        Recording...
      </span>
    )}
    {audioBlob && !recording && (
      <span className="text-green-600 text-xs font-medium">
        ✓ Audio captured — ready to transcribe
      </span>
    )}
  </div>

  {audioBlob && !recording && (
    <div className="mt-3">
      <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-8" />
      <button
        onClick={sendAudioForTranscription}
        disabled={transcribing}
        className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {transcribing ? 'Transcribing...' : 'Transcribe & Fill Form'}
      </button>
    </div>
  )}

  {transcript && (
    <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-medium text-gray-500 mb-1">Transcript:</p>
      <p className="text-sm text-gray-700">{transcript}</p>
    </div>
  )}
</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}