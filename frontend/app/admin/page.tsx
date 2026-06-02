'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { token, user, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: '', email: '', password: '', specialization: 'General Physician' });
  const [addLoading, setAddLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token]);

  const handleToggle = async (doctorId: string) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/doctor/${doctorId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/add-doctor`,
        doctorForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Doctor added successfully!');
      setDoctorForm({ name: '', email: '', password: '', specialization: 'General Physician' });
      setShowAddDoctor(false);
      fetchDashboard();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add doctor');
    } finally {
      setAddLoading(false);
    }
  };

  const urgencyBadge = (urgency: string) => {
    if (urgency === 'High') return (
      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>🚨 High</span>
    );
    if (urgency === 'Medium') return (
      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#fefce8', color: '#a16207', border: '1px solid #fde68a', fontWeight: 700 }}>⚠ Medium</span>
    );
    return (
      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 700 }}>✓ Low</span>
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
      waiting: { bg: '#fefce8', color: '#a16207', border: '#fde68a', label: 'Waiting' },
      'in-consultation': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'In Consult' },
      done: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Done' },
    };
    const s = map[status] || map.waiting;
    return (
      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 700 }}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#319795',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
        fontFamily: "'Instrument Sans', 'DM Sans', sans-serif",
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');`}</style>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ animation: 'spin 1s linear infinite' }} width="22" height="22" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
            <path d="M8 2a6 6 0 016 6" stroke="#86efac" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: "'Instrument Sans', sans-serif" }}>Loading dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f0', fontFamily: "'Instrument Sans', 'DM Sans', sans-serif", color: '#1a2e1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(5,46,22,0.12) !important; }
        .doctor-card { transition: transform 0.2s, box-shadow 0.2s; }
        .doctor-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(5,46,22,0.1) !important; }
        .table-row:hover { background: #f0fdf4 !important; }
        .toggle-btn { transition: all 0.2s; }
        .toggle-btn:hover { filter: brightness(0.95); transform: scale(0.97); }
        input:focus, select:focus { outline: none !important; border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.12) !important; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 4px; }

        @media (max-width: 768px) {
          .nav-user-name { display: none !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .doctors-grid { grid-template-columns: 1fr !important; }
          .add-doctor-grid { grid-template-columns: 1fr !important; }
          .table-wrapper { overflow-x: auto; }
          .page-content { padding: 16px !important; }
          .page-heading { font-size: 22px !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 4px 24px rgba(5,46,22,0.35)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#319795',
            border: '1px solid rgba(134,239,172,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3v5l3 3-1.5 1.5L8 11V5h2z" fill="white"/>
              </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#09090b', margin: 0, letterSpacing: '-0.01em', fontFamily: "'Fraunces', serif" }}>Smart Clinic AI</p>
            <p style={{ fontSize: 10, color: '#319795', margin: 0, fontWeight: 500, letterSpacing: '0.08em' }}>Admin Console</p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="nav-user-name" style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#09090b', margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: 10, color: '#319795', margin: 0, fontWeight: 500 }}>Administrator</p>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#052e16',
            border: '2px solid rgba(134,239,172,0.4)',
          }}>
            {initials}
          </div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            style={{
              background: 'rgba(254,202,202,0.1)', border: '1px solid rgba(254,202,202,0.2)',
              color: '#fca5a5', fontSize: 12, fontWeight: 600,
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(254,202,202,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(254,202,202,0.1)')}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* HERO STRIP */}
      <div style={{
        padding: '28px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#4a5568', margin: '0 0 4px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Good day, {user?.name?.split(' ')[0]}</p>
          <h1 className="page-heading" style={{ fontSize: 28, fontWeight: 400, color: '#09090b', margin: 0, fontFamily: "'Fraunces', serif", letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Clinic Dashboard <span style={{ fontStyle: 'italic', color: '#319795' }}>Overview</span>
          </h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 48px', animation: 'fadeIn 0.4s ease' }}>

        {/* Success toast */}
        {success && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: '4px solid #16a34a',
            borderRadius: 12, padding: '12px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10, animation: 'slideDown 0.3s ease',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#166534', margin: 0 }}>{success}</p>
          </div>
        )}

        {/* AI Insights */}
        {data?.insights && (
          <div style={{
            background: '#319795',
            borderRadius: 20, padding: '20px 24px', marginBottom: 20,
            border: '1px solid #166534', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(134,239,172,0.05)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(134,239,172,0.12)', border: '1px solid rgba(134,239,172,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.8">
                  <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#86efac', margin: '0 0 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Daily Insights</p>
                <p style={{ fontSize: 13, color: '#dcfce7', margin: 0, lineHeight: 1.7 }}>{data.insights}</p>
              </div>
            </div>
          </div>
        )}

        {/* Workload imbalance */}
        {data?.doctorStats && (() => {
          const activeDoctors = data.doctorStats.filter((d: any) => d.isAvailable && d.totalPatients > 0);
          if (activeDoctors.length < 2) return null;
          const maxLoad = Math.max(...activeDoctors.map((d: any) => d.totalPatients));
          const minLoad = Math.min(...activeDoctors.map((d: any) => d.totalPatients));
          const overloaded = activeDoctors.find((d: any) => d.totalPatients === maxLoad);
          if (maxLoad >= minLoad * 2) {
            return (
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b',
                borderRadius: 14, padding: '14px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', margin: '0 0 3px' }}>Workload Imbalance Detected</p>
                  <p style={{ fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
                    <strong>{overloaded?.name}</strong> has {maxLoad} patients while others have significantly fewer. Consider reassigning or marking another doctor available.
                  </p>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* STATS */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Patients', value: data?.stats?.totalPatients, icon: '👥', accent: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', num: '#14532d' },
            { label: 'Waiting', value: data?.stats?.waiting, icon: '⏳', accent: '#ca8a04', bg: '#fefce8', border: '#fde68a', num: '#713f12' },
            { label: 'In Consultation', value: data?.stats?.inConsultation, icon: '🩺', accent: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', num: '#1e3a8a' },
            { label: 'Completed', value: data?.stats?.done, icon: '✅', accent: '#059669', bg: '#ecfdf5', border: '#a7f3d0', num: '#064e3b' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card" style={{
              background: stat.bg, border: `1px solid ${stat.border}`,
              borderRadius: 18, padding: '20px 22px',
              boxShadow: '0 2px 8px rgba(5,46,22,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#4b7b4b', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</p>
                <span style={{ fontSize: 18 }}>{stat.icon}</span>
              </div>
              <p style={{ fontSize: 36, fontWeight: 700, color: stat.num, margin: 0, fontFamily: "'Fraunces', serif", lineHeight: 1 }}>{stat.value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* DOCTORS SECTION */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 400, color: '#14532d', margin: 0, fontFamily: "'Fraunces', serif" }}>Medical Staff</h2>
              <p style={{ fontSize: 12, color: '#4b7b4b', margin: '2px 0 0' }}>{data?.doctorStats?.length || 0} registered doctors</p>
            </div>
            <button
              onClick={() => setShowAddDoctor(!showAddDoctor)}
              style={{
                background: showAddDoctor
                  ? 'transparent'
                  : '#319795',
                border: showAddDoctor ? '1px solid #16a34a' : 'none',
                color: showAddDoctor ? '#16a34a' : '#fff',
                fontSize: 13, fontWeight: 600,
                padding: '9px 18px', borderRadius: 11,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: showAddDoctor ? 'none' : '0 4px 14px rgba(22,163,74,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {showAddDoctor ? '✕ Cancel' : '+ Add Doctor'}
            </button>
          </div>

          {/* Add Doctor Form */}
          {showAddDoctor && (
            <div style={{
              background: '#fff', border: '1px solid #dcfce7', borderRadius: 20,
              padding: '24px', marginBottom: 18,
              boxShadow: '0 4px 24px rgba(5,46,22,0.08)',
              animation: 'slideDown 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#14532d', margin: 0 }}>New Doctor Registration</h3>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleAddDoctor}>
                <div className="add-doctor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  {[
                    { type: 'text', placeholder: 'Full name', key: 'name' },
                    { type: 'email', placeholder: 'Email address', key: 'email' },
                    { type: 'password', placeholder: 'Password', key: 'password' },
                  ].map(field => (
                    <input
                      key={field.key}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={doctorForm[field.key as keyof typeof doctorForm]}
                      onChange={e => setDoctorForm({ ...doctorForm, [field.key]: e.target.value })}
                      required
                      style={{
                        border: '1px solid #d1fae5', background: '#f8fffe',
                        borderRadius: 11, padding: '11px 14px', fontSize: 13,
                        color: '#1a2e1a', fontFamily: "'Instrument Sans', sans-serif",
                        transition: 'border-color 0.2s',
                      }}
                    />
                  ))}
                  <select
                    value={doctorForm.specialization}
                    onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    style={{
                      border: '1px solid #d1fae5', background: '#f8fffe',
                      borderRadius: 11, padding: '11px 14px', fontSize: 13,
                      color: '#1a2e1a', fontFamily: "'Instrument Sans', sans-serif",
                      cursor: 'pointer',
                    }}
                  >
                    {['General Physician', 'Cardiologist', 'Dermatologist', 'Orthopedic', 'ENT Specialist', 'Neurologist', 'Gastroenterologist', 'Pediatrician', 'Gynecologist', 'Psychiatrist'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{
                    width: '100%',
                    background: addLoading ? '#319795' : '#319795',
                    border: 'none', borderRadius: 12,
                    padding: '13px', fontSize: 14, fontWeight: 700,
                    color: addLoading ? '#4b7b4b' : '#fff', cursor: addLoading ? 'not-allowed' : 'pointer',
                    boxShadow: addLoading ? 'none' : '0 4px 16px rgba(22,163,74,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  {addLoading ? (
                    <>
                      <svg style={{ animation: 'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="#4b7b4b" strokeWidth="2" strokeOpacity="0.3"/>
                        <path d="M8 2a6 6 0 016 6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Adding Doctor…
                    </>
                  ) : 'Register Doctor'}
                </button>
              </form>
            </div>
          )}

          {/* Doctor Cards */}
          <div className="doctors-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {data?.doctorStats?.map((doc: any) => (
              <div key={doc._id} className="doctor-card" style={{
                background: '#fff', border: '1px solid #e2f5e2',
                borderRadius: 20, padding: '20px 22px',
                boxShadow: '0 2px 10px rgba(5,46,22,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: doc.isAvailable ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : '#f3f4f6',
                      border: `1.5px solid ${doc.isAvailable ? '#86efac' : '#e5e7eb'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 800,
                      color: doc.isAvailable ? '#166534' : '#9ca3af',
                    }}>
                      {doc.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#14532d', margin: 0 }}>{doc.name}</p>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: '1px 0 0' }}>{doc.email}</p>
                      <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, margin: '1px 0 0' }}>{doc.specialization || 'General Physician'}</p>
                    </div>
                  </div>
                  <button
                    className="toggle-btn"
                    onClick={() => handleToggle(doc._id)}
                    style={{
                      fontSize: 11, padding: '5px 13px', borderRadius: 99, fontWeight: 700, cursor: 'pointer',
                      background: doc.isAvailable ? '#f0fdf4' : '#fef2f2',
                      color: doc.isAvailable ? '#166534' : '#dc2626',
                      border: `1px solid ${doc.isAvailable ? '#bbf7d0' : '#fecaca'}`,
                    }}
                  >
                    {doc.isAvailable ? '● Available' : '○ Unavailable'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: '#f8fffe', border: '1px solid #e2f5e2', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#14532d', margin: 0, fontFamily: "'Fraunces', serif" }}>{doc.totalPatients}</p>
                    <p style={{ fontSize: 10, color: '#4b7b4b', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</p>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#166534', margin: 0, fontFamily: "'Fraunces', serif" }}>{doc.donePatients}</p>
                    <p style={{ fontSize: 10, color: '#166534', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Done</p>
                  </div>
                </div>

                {/* Mini progress bar */}
                {doc.totalPatients > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ height: 4, background: '#dcfce7', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((doc.donePatients / doc.totalPatients) * 100)}%`,
                        background: 'linear-gradient(90deg, #16a34a, #4ade80)',
                        borderRadius: 99, transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#4b7b4b', margin: '5px 0 0', textAlign: 'right', fontWeight: 600 }}>
                      {Math.round((doc.donePatients / doc.totalPatients) * 100)}% complete
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PATIENTS TABLE */}
        <div>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 18, fontWeight: 400, color: '#14532d', margin: 0, fontFamily: "'Fraunces', serif" }}>Today's Patients</h2>
            <p style={{ fontSize: 12, color: '#4b7b4b', margin: '2px 0 0' }}>{data?.patients?.length || 0} registered today</p>
          </div>

          <div className="table-wrapper" style={{ background: '#fff', border: '1px solid #e2f5e2', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 10px rgba(5,46,22,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderBottom: '1px solid #bbf7d0' }}>
                  {['Token', 'Patient', 'Age', 'Doctor', 'Urgency', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '13px 18px', fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.patients?.map((patient: any, i: number) => (
                  <tr
                    key={patient._id}
                    className="table-row"
                    style={{ borderBottom: i < data.patients.length - 1 ? '1px solid #f0fdf4' : 'none', transition: 'background 0.15s' }}
                  >
                    <td style={{ padding: '13px 18px', fontWeight: 800, color: '#16a34a', fontFamily: "'Fraunces', serif", fontSize: 15 }}>#{patient.tokenNumber}</td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 800, color: '#166534', flexShrink: 0,
                        }}>
                          {patient.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: '#1a2e1a' }}>{patient.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', color: '#4b7b4b' }}>{patient.age} yrs</td>
                    <td style={{ padding: '13px 18px', color: '#4b7b4b' }}>{patient.assignedDoctor?.name || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Unassigned</span>}</td>
                    <td style={{ padding: '13px 18px' }}>{urgencyBadge(patient.urgency)}</td>
                    <td style={{ padding: '13px 18px' }}>{statusBadge(patient.status)}</td>
                  </tr>
                ))}
                {(!data?.patients || data.patients.length === 0) && (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 10 }}>🏥</div>
                      <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>No patients registered today</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}