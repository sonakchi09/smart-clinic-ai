'use client';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const font = "'DM Sans', 'Segoe UI', sans-serif";

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
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<any>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
        ' · ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
      setTranscript('');
      setAudioBlob(null);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch (err) {
      alert('Could not access microphone. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const sendAudioForTranscription = async () => {
    if (!audioBlob) return;
    setTranscribing(true);
    try {
      const fd = new FormData();
      fd.append('audio', audioBlob, 'recording.webm');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/transcribe`, fd,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      const { transcript: text, structured } = res.data;
      setTranscript(text);
      if (structured) {
        setForm({
          consultationNotes: structured.diagnosis + '\n\nInstructions: ' + structured.instructions,
          prescription: structured.medicines + '\n\nFollow-up: ' + structured.followUp,
        });
      }
    } catch { alert('Transcription failed. Please try again.'); }
    finally { setTranscribing(false); }
  };

  const fetchPatients = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patients/my-patients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatients(res.data.patients);
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    if (!token || !user) return;
    fetchPatients();
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.emit('join-doctor-room', user.id);
    socket.on('new-patient', ({ patient }) => {
      setPatients(prev => [...prev, patient]);
      setNewPatientAlert(`New patient: ${patient.name} (Token #${patient.tokenNumber})`);
      setTimeout(() => setNewPatientAlert(''), 5000);
    });
    socket.on('patient-updated', ({ patient }) => {
      setPatients(prev => prev.map(p => p._id === patient._id ? patient : p));
      if (selectedPatient?._id === patient._id) setSelectedPatient(patient);
    });
    return () => { socket.disconnect(); };
  }, [token, user]);

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
    } catch (err) { console.log(err); }
    finally { setSummaryLoading(false); }
  };

  const openPatient = (patient: any) => {
    setSelectedPatient(patient);
    setForm({ consultationNotes: patient.consultationNotes || '', prescription: patient.prescription || '' });
    setSuccess('');
    setAiSummary('');
    setTranscript('');
    setAudioBlob(null);
    if (isMobile) setShowSidebar(false);
    fetchAiSummary(patient);
  };

  const handleSave = async (status: string) => {
    setSaving(true);
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patients/${selectedPatient._id}/consultation`,
        { ...form, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(status === 'done' ? 'Consultation complete!' : 'Notes saved successfully!');
      setSelectedPatient(res.data.patient);
      fetchPatients();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { console.log(err); }
    finally { setSaving(false); }
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.tokenNumber).includes(searchQuery)
  );

  const waiting = patients.filter(p => p.status === 'waiting').length;
  const inConsult = patients.filter(p => p.status === 'in-consultation').length;
  const done = patients.filter(p => p.status === 'done').length;
  const hasHighUrgency = patients.some(p => p.urgency === 'High' && p.status === 'waiting');
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';
  const fmtSeconds = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const urgencyConfig: Record<string, { text: string; bg: string; border: string; dot: string }> = {
    High: { text: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
    Medium: { text: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
    Low: { text: '#059669', bg: '#f0fdf9', border: '#99f6e4', dot: '#10b981' },
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    waiting: { label: 'Waiting', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    'in-consultation': { label: 'In Consultation', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
    done: { label: 'Done', color: '#059669', bg: '#f0fdf9', border: '#99f6e4' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#eef1f5', fontFamily: font, color: '#111827', display: 'flex', flexDirection: 'column' }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ping { 0%{transform:scale(1);opacity:0.8} 80%,100%{transform:scale(2.2);opacity:0} }
        .patient-card:hover { background: #f0fdf9 !important; border-color: #0d9488 !important; }
        .patient-card.selected { background: #f0fdf9 !important; border-color: #0d9488 !important; }
        textarea:focus, input:focus { outline: none !important; border-color: #0d9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.1) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        
        @media (max-width: 767px) {
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 30;
          }
        }
      `}</style>

      {/* TOP NAV */}
      <nav style={{
        background: '#ffffff', borderBottom: '1px solid #e5e7eb',
        padding: isMobile ? '0 16px' : '0 28px', 
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        flexWrap: 'wrap',
        gap: isMobile ? 8 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isMobile && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#0d9488',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3v5l3 3-1.5 1.5L8 11V5h2z" fill="white"/>
            </svg>
          </div>
          {!isMobile && (
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Smart Clinic AI</p>
              <p style={{ fontSize: 10, color: '#0d9488', margin: 0, fontWeight: 600 }}>Doctor Portal</p>
            </div>
          )}
        </div>

        <div style={{ position: 'relative', flex: isMobile ? 1 : 'none', maxWidth: isMobile ? 'none' : 360, margin: isMobile ? '0' : '0 32px', minWidth: isMobile ? 0 : 'auto' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" placeholder={isMobile ? "Search..." : "Search patients..."}
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', height: 38, background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 10, padding: '0 14px 0 36px', fontSize: 13, color: '#111827',
              fontFamily: font,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <button style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </button>
            {hasHighUrgency && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#ef4444', animation: 'ping 1.2s ease-out infinite' }} />
              </span>
            )}
          </div>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{user?.name || 'Dr. Sharma'}</p>
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 11, cursor: 'pointer', fontWeight: 500, padding: 0 }}
                >
                  Sign Out
                </button>
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0d9488, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {initials}
              </div>
            </div>
          )}

          {isMobile && (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0d9488, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
          )}
        </div>
      </nav>

      {/* NEW PATIENT ALERT */}
      <AnimatePresence>
        {newPatientAlert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 44, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              background: '#0d9488',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: isMobile ? 12 : 13, fontWeight: 700, color: '#fff', overflow: 'hidden',
              padding: isMobile ? '0 16px' : '0',
            }}
          >
            <span style={{ fontSize: 15 }}>🔔</span> 
            <span style={{ whiteSpace: isMobile ? 'normal' : 'nowrap' }}>{newPatientAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: `calc(100vh - ${64 + (newPatientAlert ? 44 : 0)}px)` }}>

        {/* SIDEBAR OVERLAY FOR MOBILE */}
        {isMobile && showSidebar && (
          <div
            className="sidebar-overlay"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* LEFT QUEUE PANEL */}
        <div style={{
          width: isMobile ? '100%' : 320, 
          flexShrink: 0,
          background: '#ffffff',
          borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
          display: showSidebar ? 'flex' : isMobile ? 'none' : 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          position: isMobile ? 'fixed' : 'relative',
          height: isMobile ? '100%' : 'auto',
          zIndex: 31,
          maxHeight: isMobile ? 'calc(100vh - 64px)' : 'auto',
          boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
        }}>
          <div style={{ padding: '20px 20px 0', position: 'sticky', top: 0, background: '#ffffff', zIndex: 1, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
              <div>
                <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: '#319795', margin: 0 }}>Today's Queue</h2>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{patients.length} total</p>
              </div>
              <button
                onClick={fetchPatients}
                style={{ background: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#0d9488', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
              >
                ↻ {isMobile ? '' : 'Refresh'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { label: isMobile ? 'Waiting' : 'Waiting', val: waiting, color: '#d97706', bg: '#fffbeb' },
                { label: isMobile ? 'Consult' : 'In Consult', val: inConsult, color: '#4f46e5', bg: '#eef2ff' },
                { label: 'Done', val: done, color: '#059669', bg: '#f0fdf9' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '8px 10px' }}>
                  <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: s.color, margin: 0 }}>{s.val}</p>
                  <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {hasHighUrgency && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderLeft: '3px solid #ef4444',
                borderRadius: 10, padding: '10px 12px',
              }}>
                <p style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: '#dc2626', margin: 0 }}>
                  🚨 High urgency patient(s) in queue
                </p>
              </div>
            )}
          </div>

          <div style={{ padding: '12px 14px 20px', flex: 1 }}>
            {filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏥</div>
                <p style={{ color: '#9ca3af', fontSize: 13 }}>No patients assigned yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredPatients.map((patient) => {
                  const uc = urgencyConfig[patient.urgency] || urgencyConfig.Medium;
                  const sc = statusConfig[patient.status] || statusConfig.waiting;
                  const isSelected = selectedPatient?._id === patient._id;

                  return (
                    <div
                      key={patient._id}
                      onClick={() => openPatient(patient)}
                      className={`patient-card ${isSelected ? 'selected' : ''}`}
                      style={{
                        background: isSelected ? '#f0fdf9' : '#f9fafb',
                        border: `1px solid ${isSelected ? '#0d9488' : patient.urgency === 'High' ? '#fecaca' : '#e5e7eb'}`,
                        borderLeft: `3px solid ${uc.dot}`,
                        borderRadius: 14, padding: '13px 14px',
                        cursor: 'pointer', transition: 'all 0.18s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#0d9488', flexShrink: 0 }}>#{patient.tokenNumber}</span>
                        <div style={{ display: 'flex', gap: 5, minWidth: 0, overflow: 'hidden' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: uc.bg, color: uc.text, border: `1px solid ${uc.border}`, whiteSpace: 'nowrap' }}>
                            {patient.urgency}
                          </span>
                          {!isMobile && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap' }}>
                              {sc.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.name}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 4px' }}>{patient.age} yrs · {patient.gender}</p>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.symptoms}</p>
                      {patient.suggestedDoctorType && !isMobile && (
                        <p style={{ fontSize: 10, color: '#0d9488', fontWeight: 600, margin: '5px 0 0' }}>AI: {patient.suggestedDoctorType}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CONSULTATION PANEL */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isMobile ? '16px' : '28px 32px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0,
          width: isMobile ? '100%' : 'auto',
        }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: isMobile ? 8 : 0, flexDirection: isMobile ? 'column' : 'row' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Doctor Dashboard</p>
              <h1 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 900, color: '#319795', margin: 0, letterSpacing: '-0.03em' }}>
                Welcome, {user?.name?.split(' ')[0] || 'Doctor'}
              </h1>
            </div>
            {!isMobile && (
              <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, flexShrink: 0, marginTop: 8 }}>{currentTime}</p>
            )}
          </div>

          {!selectedPatient ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: isMobile ? '40px 20px' : '80px 40px',
              textAlign: 'center',
              background: '#ffffff', border: '1px dashed #e5e7eb', borderRadius: 24,
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf9', border: '1px solid #99f6e4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>No Patient Selected</p>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
                {isMobile ? 'Tap a patient from the queue above' : 'Select a patient from the queue to begin consultation and AI-assisted diagnosis.'}
              </p>
            </div>
          ) : (
            <motion.div
              key={selectedPatient._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}
            >
              {/* Patient header */}
              <div style={{
                background: '#ffffff', border: '1px solid #e5e7eb',
                borderRadius: 20, padding: isMobile ? '16px 12px' : '20px 24px',
                display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 12 : 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: '#f0fdf9', border: '1.5px solid #99f6e4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 900, color: '#0d9488', flexShrink: 0,
                  }}>
                    {selectedPatient.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 900, color: '#111827', margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedPatient.name}</h2>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0d9488', background: '#f0fdf9', padding: '2px 10px', borderRadius: 8, border: '1px solid #99f6e4', whiteSpace: 'nowrap' }}>
                        #{selectedPatient.tokenNumber}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                      {selectedPatient.age} yrs · {selectedPatient.gender} {!isMobile && `· ${selectedPatient.phone}`}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 6 }}>
                  {(() => {
                    const uc = urgencyConfig[selectedPatient.urgency] || urgencyConfig.Medium;
                    const sc = statusConfig[selectedPatient.status] || statusConfig.waiting;
                    return (
                      <>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: uc.bg, color: uc.text, border: `1px solid ${uc.border}` }}>
                          {selectedPatient.urgency} Urgency
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {sc.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Symptoms */}
              <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reported Symptoms</p>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{selectedPatient.symptoms}</p>
              </div>

              {/* AI Summary */}
              <div style={{
                background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)',
                border: '1px solid #e9d5ff',
                borderRadius: 18, padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                      <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 8v4M12 16h.01"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: isMobile ? 12 : 13, fontWeight: 800, color: '#7c3aed', margin: 0 }}>AI Pre-Consultation Summary</p>
                </div>
                {summaryLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#7c3aed" strokeWidth="2" strokeOpacity="0.3"/>
                      <path d="M8 2a6 6 0 016 6" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p style={{ fontSize: 13, color: '#7c3aed', margin: 0 }}>Generating clinical summary...</p>
                  </div>
                ) : aiSummary ? (
                  <p style={{ fontSize: 13, color: '#5b21b6', margin: 0, lineHeight: 1.7 }}>{aiSummary}</p>
                ) : (
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Summary will appear here.</p>
                )}
              </div>

              {/* Success */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{ background: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0d9488', margin: 0 }}>{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice to Prescription */}
              <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Voice to Prescription</p>
                  {recording && (
                    <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>{fmtSeconds(recordingSeconds)}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  {!recording ? (
                    <button
                      onClick={startRecording}
                      disabled={selectedPatient?.status === 'done'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#0d9488', color: '#ffffff',
                        border: 'none', borderRadius: 12,
                        padding: '11px 20px', fontSize: 13, fontWeight: 700,
                        cursor: selectedPatient?.status === 'done' ? 'not-allowed' : 'pointer',
                        opacity: selectedPatient?.status === 'done' ? 0.5 : 1,
                        boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
                        flex: isMobile ? 1 : 'auto',
                        minWidth: isMobile ? 0 : 'auto',
                      }}
                    >
                      🎤 {isMobile ? 'Dictate' : 'Start Live Dictation'}
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#fef2f2', color: '#ef4444',
                        border: '1px solid #fecaca', borderRadius: 12,
                        padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        flex: isMobile ? 1 : 'auto',
                      }}
                    >
                      ⏹ Stop
                    </button>
                  )}
                  {audioBlob && !recording && (
                    <span style={{ fontSize: 12, color: '#0d9488', fontWeight: 600, flex: isMobile ? '1 0 100%' : 'auto' }}>✓ Audio captured</span>
                  )}
                </div>

                {audioBlob && !recording && (
                  <div style={{ marginTop: 14 }}>
                    <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '100%', height: 36, borderRadius: 8 }} />
                    <button
                      onClick={sendAudioForTranscription}
                      disabled={transcribing}
                      style={{
                        marginTop: 10, width: '100%',
                        background: transcribing ? '#f9fafb' : '#eef2ff',
                        color: '#4f46e5', border: '1px solid #c7d2fe',
                        borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 700,
                        cursor: transcribing ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {transcribing ? (
                        <>
                          <svg style={{ animation: 'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6" stroke="#4f46e5" strokeWidth="2" strokeOpacity="0.3"/>
                            <path d="M8 2a6 6 0 016 6" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          Transcribing...
                        </>
                      ) : 'Transcribe & Fill Form'}
                    </button>
                  </div>
                )}

                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px' }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transcript</p>
                    <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>{transcript}</p>
                  </motion.div>
                )}
              </div>

              {/* Notes + Prescription */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 14 }}>
                {[
                  { label: 'Consultation Notes', key: 'consultationNotes', placeholder: 'Enter diagnosis and notes...' },
                  { label: 'Prescription', key: 'prescription', placeholder: 'Enter medicines, dosage, instructions...' },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {field.label}
                    </label>
                    <textarea
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={isMobile ? 4 : 5}
                      style={{
                        width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb',
                        borderRadius: 14, padding: '13px 15px', fontSize: 13, color: '#111827',
                        resize: 'vertical', fontFamily: font, lineHeight: 1.6,
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: isMobile ? 8 : 12, flexDirection: isMobile ? 'column' : 'row' }}>
                <button
                  onClick={() => handleSave('in-consultation')}
                  disabled={saving || selectedPatient.status === 'done'}
                  style={{
                    flex: isMobile ? '1 0 auto' : 1,
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb', borderRadius: 14,
                    padding: isMobile ? '12px' : '14px', fontSize: isMobile ? 13 : 14, fontWeight: 700, color: '#6b7280',
                    cursor: saving || selectedPatient.status === 'done' ? 'not-allowed' : 'pointer',
                    opacity: selectedPatient.status === 'done' ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {saving ? (
                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#6b7280" strokeWidth="2" strokeOpacity="0.3"/>
                      <path d="M8 2a6 6 0 016 6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : '💾'} {isMobile ? 'Save' : 'Save Notes'}
                </button>

                <button
                  onClick={() => handleSave('done')}
                  disabled={saving || selectedPatient.status === 'done'}
                  style={{
                    flex: isMobile ? '1 0 auto' : 2,
                    background: selectedPatient.status === 'done' ? '#f0fdf9' : '#0d9488',
                    border: 'none', borderRadius: 14,
                    padding: isMobile ? '12px' : '14px', fontSize: isMobile ? 13 : 14, fontWeight: 800,
                    color: selectedPatient.status === 'done' ? '#0d9488' : '#ffffff',
                    cursor: saving || selectedPatient.status === 'done' ? 'not-allowed' : 'pointer',
                    opacity: selectedPatient.status === 'done' ? 0.7 : 1,
                    boxShadow: selectedPatient.status !== 'done' ? '0 6px 20px rgba(13,148,136,0.3)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {saving ? (
                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3"/>
                      <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : '✓'}
                  {selectedPatient.status === 'done' ? 'Done' : isMobile ? 'Complete' : 'Mark as Complete & Next'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}