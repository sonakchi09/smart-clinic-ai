'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

export default function ReceptionistPage() {
  const { token, user, logout } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', age: '', gender: '', symptoms: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'queue'>('register');
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const typingTimer = useRef<any>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
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
        ' · ' +
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatients(res.data.patients);
    } catch (err) {
      console.log(err);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchPatients();

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('dashboard-update', () => {
      fetchPatients();
    });

    return () => { socket.disconnect(); };
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'symptoms') {
      clearTimeout(typingTimer.current);
      setAiSuggestion(null);
      if (value.length > 10) {
        typingTimer.current = setTimeout(() => fetchAiSuggestion(value), 1000);
      }
    }
  };

  const fetchAiSuggestion = async (symptoms: string) => {
    setAiLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/suggest-doctor`,
        { symptoms },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiSuggestion(res.data.suggestion);
    } catch (err) {
      console.log(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patients/register`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      setForm({ name: '', age: '', gender: '', symptoms: '', phone: '' });
      setAiSuggestion(null);
      fetchPatients();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'User';
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'R';

  const urgencyColor = (u: string) => ({
    High: { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
    Medium: { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    Low: { text: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  }[u] || { text: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' });

  return (
    <div style={{
      minHeight: '100vh',
      background: isMobile 
        ? '#ffffff'
        : 'radial-gradient(circle at top left, rgba(255,255,255,0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(15,118,110,0.35), transparent 40%), #0d9488',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
    }}>

      {/* Token Modal */}
      <AnimatePresence>
        {result && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResult(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 51,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: isMobile ? '20px' : '20px',
              }}
            >
              <div style={{
                background: '#ffffff', borderRadius: isMobile ? 20 : 28,
                boxShadow: '0 40px 100px rgba(0,0,0,0.25)',
                width: '100%', maxWidth: isMobile ? '90vw' : 540, overflow: 'hidden',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                  padding: isMobile ? '20px 16px' : '28px 32px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 16 : 0,
                }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                      Token Generated Successfully
                    </p>
                    <p style={{ color: '#ffffff', fontSize: isMobile ? 48 : 64, fontWeight: 900, margin: '8px 0 0', lineHeight: 1 }}>
                      #{result.token}
                    </p>
                  </div>
                  <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>Assigned Doctor</p>
                    <p style={{ color: '#ffffff', fontSize: 16, fontWeight: 800, margin: '6px 0 0' }}>
                      {result.patient.assignedDoctor?.name || 'Being assigned'}
                    </p>
                    <span style={{
                      display: 'inline-block', marginTop: 10, fontSize: 11, fontWeight: 700,
                      padding: '5px 12px', borderRadius: 999,
                      background: 'rgba(255,255,255,0.15)',
                      color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)',
                    }}>
                      {result.patient.urgency} Urgency
                    </span>
                  </div>
                </div>

                <div style={{ padding: isMobile ? '16px' : '24px 32px', display: 'flex', gap: isMobile ? 16 : 24, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
                  <div style={{ flex: 1 }}>
                    {[
                      { label: 'Patient Name', value: result.patient.name },
                      { label: 'Age & Gender', value: `${result.patient.age} yrs · ${result.patient.gender}` },
                      { label: 'Phone', value: result.patient.phone },
                      { label: 'AI Specialist', value: result.patient.suggestedDoctorType || 'General Physician' },
                    ].map((row) => (
                      <div key={row.label} style={{
                        display: 'flex', justifyContent: 'space-between', gap: 16,
                        borderBottom: '1px solid #f3f4f6', paddingBottom: 10, marginBottom: 10,
                        flexDirection: isMobile ? 'column' : 'row',
                      }}>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{row.label}</span>
                        <span style={{ fontSize: 12, color: '#111827', fontWeight: 700 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  {result.qrCode && (
                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                      <img src={result.qrCode} alt="QR" style={{
                        width: isMobile ? 90 : 110, height: isMobile ? 90 : 110, borderRadius: 16,
                        border: '1px solid #e5e7eb',
                      }} />
                      <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>Scan to track</p>
                    </div>
                  )}
                </div>

                <div style={{ padding: isMobile ? '12px 16px' : '0 32px 24px' }}>
                  <button
                    onClick={() => setResult(null)}
                    style={{
                      width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb',
                      borderRadius: 14, padding: '12px', fontSize: 13, fontWeight: 700,
                      color: '#6b7280', cursor: 'pointer',
                    }}
                  >
                    Close & Register Another Patient
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div style={{
        width: '100%', maxWidth: 1320, margin: '0 auto',
        minHeight: '100vh', display: 'flex',
        background: '#ffffff',
        flexDirection: isMobile ? 'column' : 'row',
      }}>

        {/* LEFT PANEL */}
        <div style={{
          flex: isMobile ? '0 0 auto' : '0 0 45%',
          maxWidth: isMobile ? '100%' : '45%',
          padding: isMobile ? '24px 16px' : '40px 48px',
          display: 'flex', flexDirection: 'column',
          background: isMobile 
            ? '#f9fafb'
            : 'linear-gradient(160deg, rgba(255,255,255,0.9), rgba(240,253,250,0.95))',
          position: 'relative', overflow: 'hidden',
          borderBottom: isMobile ? '1px solid #e5e7eb' : 'none',
        }}>
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13,148,136,0.06), transparent 70%)',
            top: -100, left: -100, pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 32 : 60, gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(13,148,136,0.3)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3v5l3 3-1.5 1.5L8 11V5h2z" fill="white"/>
                </svg>
              </div>
              <div>
  <p style={{ fontSize: 14, color: '#111827', fontWeight: 800, margin: 0 }}>Smart Clinic AI</p>
  <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>Receptionist Portal</p>
</div>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Live system
              </div>
            )}
          </div>

          {/* Hero text */}
          <div style={{ flex: 1 }}>
            {!isMobile && (
              <>
                <p style={{ color: '#9ca3af', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Reception Dashboard
                </p>
                <h1 style={{
                  color: '#111827', fontSize: 'clamp(40px, 4vw, 62px)',
                  lineHeight: 0.98, margin: 0, fontWeight: 900, letterSpacing: '-0.04em',
                }}>
                  Register patients<br />with{' '}
                  <span style={{ color: '#0d9488' }}>AI triage</span>.
                </h1>
                <p style={{ marginTop: 20, color: '#6b7280', fontSize: 15, lineHeight: 1.7, maxWidth: 380 }}>
                  Speed up front desk workflow, auto-suggest specialists, and generate tokens with a clean modern interface.
                </p>
              </>
            )}

            {/* Stats pills */}
            <div style={{ display: 'flex', gap: 10, marginTop: isMobile ? 0 : 32, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Today', value: patients.length.toString() },
                { label: 'Waiting', value: patients.filter(p => p.status === 'waiting').length.toString() },
                { label: 'Completed', value: patients.filter(p => p.status === 'done').length.toString() },
              ].map((s) => (
                <div key={s.label} style={{
                  background: '#f0fdf9', border: '1px solid #99f6e4',
                  borderRadius: 12, padding: '10px 16px', textAlign: 'center',
                  flex: isMobile ? '1 1 calc(33.333% - 8px)' : 'auto',
                }}>
                  <p style={{ color: '#0d9488', fontSize: isMobile ? 16 : 20, fontWeight: 900, margin: 0 }}>{s.value}</p>
                  <p style={{ color: '#6b7280', fontSize: 10, margin: '2px 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* AI Suggestion */}
            {!isMobile && (
              <div style={{ marginTop: 40 }}>
                <AnimatePresence mode="wait">
                  {aiLoading && (
                    <motion.div
                      key="loading"
                      initial={{ x: -60, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -60, opacity: 0 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: '#f0fdf9', border: '1px solid #99f6e4',
                        borderRadius: 16, padding: '16px 20px',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                          <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', margin: 0 }}>AI analyzing symptoms...</p>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>Suggesting specialist in real time</p>
                      </div>
                    </motion.div>
                  )}

                  {aiSuggestion && !aiLoading && (
                    <motion.div
                      key="suggestion"
                      initial={{ x: -80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -80, opacity: 0 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 180 }}
                      style={{
                        background: '#ffffff',
                        border: `1px solid ${urgencyColor(aiSuggestion.urgency).border}`,
                        borderLeft: `4px solid ${urgencyColor(aiSuggestion.urgency).text}`,
                        borderRadius: 16, padding: '18px 20px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: urgencyColor(aiSuggestion.urgency).bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={urgencyColor(aiSuggestion.urgency).text} strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', margin: 0 }}>AI Triage Result</p>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                              background: urgencyColor(aiSuggestion.urgency).bg,
                              color: urgencyColor(aiSuggestion.urgency).text,
                              border: `1px solid ${urgencyColor(aiSuggestion.urgency).border}`,
                            }}>
                              {aiSuggestion.urgency} Urgency
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Just now • Smart Clinic AI</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 20 }}>
                        <div>
                          <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Specialist</p>
                          <p style={{ fontSize: 18, fontWeight: 900, color: '#111827', margin: '4px 0 0' }}>{aiSuggestion.doctorType}</p>
                        </div>
                        <div style={{ width: 1, background: '#f3f4f6' }} />
                        <div>
                          <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reason</p>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', lineHeight: 1.5, maxWidth: 240 }}>
                            {aiSuggestion.reason}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!aiSuggestion && !aiLoading && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        background: '#f9fafb', border: '1px dashed #e5e7eb',
                        borderRadius: 16, padding: '18px 20px',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, background: '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', margin: 0 }}>AI triage will appear here</p>
                        <p style={{ fontSize: 11, color: '#d1d5db', margin: '2px 0 0' }}>Type symptoms to get instant analysis</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          flex: isMobile ? '1 1 auto' : '0 0 55%',
          maxWidth: isMobile ? '100%' : '55%',
          background: '#f9fafb',
          padding: isMobile ? '20px 16px' : '40px 48px',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
            <div>
              <p style={{ color: '#9ca3af', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
                Welcome back
              </p>
              <h2 style={{ color: '#0d9488', fontSize: isMobile ? 22 : 'clamp(28px, 3vw, 40px)', lineHeight: 1.05, margin: '8px 0 0', fontWeight: 900, letterSpacing: '-0.03em', whiteSpace: isMobile ? 'nowrap' : 'normal' }}>
  {isMobile ? 'Create new patient.' : <>Create<br />new patient.</>}
</h2>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#6b7280', fontSize: 12, margin: 0, fontWeight: 600 }}>{firstName}</p>
                  <button
                    onClick={() => { logout(); router.push('/'); }}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 700, padding: 0 }}
                  >
                    Sign Out
                  </button>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0d9488, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ffffff', fontWeight: 900, fontSize: 14,
                }}>
                  {initials}
                </div>
              </div>
            )}
          </div>

          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0d9488, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', fontWeight: 900, fontSize: 12,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0, fontWeight: 600 }}>{firstName}</p>
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 700, padding: 0 }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 24 }}>
            {mounted ? currentTime : ''}
          </p>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', borderRadius: 14, padding: 4, width: 'fit-content' }}>
            {[
              { key: 'register', label: isMobile ? 'Register' : 'Register Patient' },
              { key: 'queue', label: isMobile ? 'Queue' : "Today's Queue" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  background: activeTab === tab.key ? '#ffffff' : 'transparent',
                  border: 'none', borderRadius: 10,
                  padding: isMobile ? '8px 14px' : '8px 18px', fontSize: isMobile ? 12 : 13, fontWeight: 700,
                  color: activeTab === tab.key ? '#0d9488' : '#9ca3af',
                  cursor: 'pointer',
                  boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Register Tab */}
          {activeTab === 'register' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{
                background: '#ffffff', borderRadius: isMobile ? 16 : 24,
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                padding: isMobile ? '20px' : '28px',
              }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16, marginBottom: 16 }}>
                    <Field label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Emily Carter" />
                    <Field label="Age" name="age" type="number" value={form.age} onChange={handleChange} placeholder="e.g., 29" />
                    <SelectField
                      label="Gender" name="gender" value={form.gender} onChange={handleChange}
                      options={[
                        { value: '', label: 'e.g., Female' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                    <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="e.g., +91 98765 43210" />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                      <label style={{ fontSize: 12, color: '#0d9488', fontWeight: 700 }}>Symptoms</label>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 10, color: '#0d9488', fontWeight: 800,
                        background: 'rgba(13,148,136,0.08)', padding: '3px 10px',
                        borderRadius: 999, border: '1px solid rgba(13,148,136,0.2)',
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                        AI TRIAGE READY
                      </span>
                    </div>
                    
                    <textarea
                      name="symptoms" value={form.symptoms} onChange={handleChange}
                      placeholder="Provide detailed symptoms (e.g., Dry cough, fatigue, shortness of breath for 3 days)..."
                      rows={isMobile ? 4 : 5} required
                      style={{
                        width: '100%', border: '1px solid #e5e7eb', background: '#f9fafb',
                        color: '#111827', borderRadius: 18, padding: '16px',
                        resize: 'vertical', outline: 'none', fontSize: 13, lineHeight: 1.6,
                        fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0d9488'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                    {/* AI Suggestion — mobile only, shown inline below symptoms */}
{isMobile && (
  <AnimatePresence mode="wait">
    {aiLoading && (
      <motion.div
        key="loading"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#f0fdf9', border: '1px solid #99f6e4',
          borderRadius: 16, padding: '14px 16px', marginTop: 12,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
            <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', margin: 0 }}>AI analyzing symptoms...</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>Suggesting specialist in real time</p>
        </div>
      </motion.div>
    )}

    {aiSuggestion && !aiLoading && (
      <motion.div
        key="suggestion"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        style={{
          background: '#ffffff',
          border: `1px solid ${urgencyColor(aiSuggestion.urgency).border}`,
          borderLeft: `4px solid ${urgencyColor(aiSuggestion.urgency).text}`,
          borderRadius: 16, padding: '14px 16px', marginTop: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#111827', margin: 0 }}>AI Triage Result</p>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: urgencyColor(aiSuggestion.urgency).bg,
            color: urgencyColor(aiSuggestion.urgency).text,
            border: `1px solid ${urgencyColor(aiSuggestion.urgency).border}`,
          }}>
            {aiSuggestion.urgency} Urgency
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Specialist</p>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#111827', margin: '3px 0 0' }}>{aiSuggestion.doctorType}</p>
          </div>
          <div style={{ width: 1, background: '#f3f4f6' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reason</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0', lineHeight: 1.5 }}>
              {aiSuggestion.reason}
            </p>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{
                        marginBottom: 16, padding: '12px 16px', borderRadius: 14,
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#dc2626', fontSize: 13,
                      }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit" disabled={loading}
                    style={{
                      width: '100%',
                      background: loading ? '#9ca3af' : 'linear-gradient(135deg, #0d9488, #0f766e)',
                      color: '#ffffff', border: 'none', borderRadius: 18,
                      padding: isMobile ? '13px' : '16px', fontSize: isMobile ? 13 : 14, fontWeight: 800,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 12px 32px rgba(13,148,136,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                          <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Registering patient...
                      </>
                    ) : 'Register Patient & Generate Token'}
                  </motion.button>
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 11, marginTop: 10 }}>
                    Ensure all details are accurate for optimal AI triage.
                  </p>
                </form>
              </div>
            </motion.div>
          )}

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                <p style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Live Queue — {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <button
                  onClick={fetchPatients}
                  style={{
                    background: '#f0fdf9', border: '1px solid #99f6e4',
                    borderRadius: 10, padding: '6px 14px',
                    fontSize: 12, fontWeight: 700, color: '#0d9488', cursor: 'pointer',
                  }}
                >
                  ↻ Refresh
                </button>
              </div>

              {patientsLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
  {[
    { label: 'Total', value: patients.length, color: '#111827' },
    { label: 'Waiting', value: patients.filter(p => p.status === 'waiting').length, color: '#f59e0b' },
    { label: 'Done', value: patients.filter(p => p.status === 'done').length, color: '#10b981' },
  ].map((s) => (
    <div key={s.label} style={{
      background: '#ffffff', border: '1px solid #e5e7eb',
      borderRadius: 12, padding: '10px 8px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
      <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>{s.label}</p>
    </div>
  ))}
</div>
              ) : patients.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  background: '#ffffff', borderRadius: 20, border: '1px dashed #e5e7eb',
                }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>🏥</p>
                  <p style={{ color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>No patients registered today</p>
                  <p style={{ color: '#d1d5db', fontSize: 12, marginTop: 4 }}>Registered patients will appear here in real time</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                    {[
                      { label: 'Total', value: patients.length, color: '#111827' },
                      { label: 'Waiting', value: patients.filter(p => p.status === 'waiting').length, color: '#f59e0b' },
                      { label: isMobile ? 'Consult' : 'In Consult', value: patients.filter(p => p.status === 'in-consultation').length, color: '#6366f1' },
                      { label: 'Done', value: patients.filter(p => p.status === 'done').length, color: '#10b981' },
                    ].map((s) => (
                      <div key={s.label} style={{
                        background: '#ffffff', border: '1px solid #e5e7eb',
                        borderRadius: 12, padding: '12px', textAlign: 'center',
                      }}>
                        <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
                        <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Patient cards */}
                  {patients.map((patient, index) => {
                    const urgency = patient.urgency || 'Medium';
                    const uc = urgencyColor(urgency);
                    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                      waiting: { label: 'Waiting', color: '#f59e0b', bg: '#fffbeb' },
                      'in-consultation': { label: 'In Consultation', color: '#6366f1', bg: '#eef2ff' },
                      done: { label: 'Done', color: '#10b981', bg: '#f0fdf9' },
                    };
                    const sc = statusConfig[patient.status] || statusConfig.waiting;

                    return (
                      <motion.div
                        key={patient._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${patient.urgency === 'High' ? '#fecaca' : '#e5e7eb'}`,
                          borderLeft: `4px solid ${uc.text}`,
                          borderRadius: 16, padding: isMobile ? '12px' : '14px 16px',
                          display: 'flex', alignItems: 'flex-start', gap: isMobile ? 10 : 14,
                          flexDirection: isMobile ? 'column' : 'row',
                        }}
                      >
                        {/* Token */}
                        <div style={{
                          width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 12, flexShrink: 0,
                          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ffffff', fontSize: isMobile ? 13 : 15, fontWeight: 900,
                        }}>
                          #{patient.tokenNumber}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: isMobile ? 12 : 13, fontWeight: 800, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.name}</p>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                              background: uc.bg, color: uc.text, border: `1px solid ${uc.border}`,
                              whiteSpace: 'nowrap',
                            }}>
                              {urgency}
                            </span>
                          </div>
                          <p style={{ fontSize: isMobile ? 10 : 11, color: '#9ca3af', margin: 0 }}>
                            {patient.age} yrs · {patient.gender} {!isMobile && `· ${patient.phone}`}
                          </p>
                          <p style={{
                            fontSize: 11, color: '#6b7280', margin: '3px 0 0',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {patient.symptoms}
                          </p>
                        </div>

                        {/* Doctor & Status */}
                        <div style={{ display: 'flex', gap: isMobile ? 8 : 12, flexShrink: 0, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                          {!isMobile && (
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Doctor</p>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: '2px 0 0' }}>
                                {patient.assignedDoctor?.name || 'Unassigned'}
                              </p>
                              {patient.suggestedDoctorType && (
                                <p style={{ fontSize: 10, color: '#0d9488', margin: '2px 0 0' }}>
                                  AI: {patient.suggestedDoctorType}
                                </p>
                              )}
                            </div>
                          )}

                          <div style={{ flexShrink: 0 }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
                              background: sc.bg, color: sc.color,
                              border: `1px solid ${sc.color}30`,
                              whiteSpace: 'nowrap',
                            }}>
                              {sc.label}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          textarea::-webkit-scrollbar { width: 4px; }
          textarea::-webkit-scrollbar-track { background: transparent; }
          textarea::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div>
      <label style={{ display: 'block', color: '#374151', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required
        style={{
          width: '100%', border: '1px solid #e5e7eb', background: '#f9fafb',
          color: '#111827', borderRadius: 16, padding: '13px 15px',
          outline: 'none', fontSize: 13, fontFamily: "'Inter', sans-serif",
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#0d9488'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }: any) {
  return (
    <div>
      <label style={{ display: 'block', color: '#374151', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{label}</label>
      <select
        name={name} value={value} onChange={onChange} required
        style={{
          width: '100%', border: '1px solid #e5e7eb', background: '#f9fafb',
          color: value ? '#111827' : '#9ca3af', borderRadius: 16,
          padding: '13px 15px', outline: 'none', fontSize: 13,
          fontFamily: "'Inter', sans-serif", appearance: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#0d9488'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}