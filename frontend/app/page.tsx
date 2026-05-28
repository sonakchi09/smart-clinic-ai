'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from './context/AuthContext';

/* ── Font loader ── */
function useDMSans() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);
}

/* ── Types ── */
const NAV_LINKS: string[] = ['Home', 'Features', 'Pricing', 'Admin'];
type AvatarColor = 'blue' | 'green' | 'purple' | 'orange';
interface AvatarProps { initials: string; color: AvatarColor; }
interface FeatureCard { role: string; icon: ReactNode; iconBg: string; title: string; description: string; }

/* ── Avatar ── */
function Avatar({ initials, color }: AvatarProps) {
  const colors: Record<AvatarColor, string> = {
    blue: 'bg-blue-500', green: 'bg-emerald-500',
    purple: 'bg-purple-500', orange: 'bg-orange-400',
  };
  return (
    <div className={`w-8 h-8 rounded-full ${colors[color]} flex items-center justify-center text-white text-[11px] font-bold border-2 border-white`}>
      {initials}
    </div>
  );
}

/* ── Login Drawer ── */
function LoginDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, { email, password });
      login(res.data.token, res.data.user);
      const role = res.data.user.role;
      if (role === 'receptionist') router.push('/receptionist');
      else if (role === 'doctor') router.push('/doctor');
      else if (role === 'admin') router.push('/admin');
      else router.push('/patient');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-full max-w-[440px] bg-[#eef1f5] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Teal top accent */}
        <div className="h-1.5 w-full bg-teal-600" />

        <div className="flex-1 flex flex-col justify-center px-10 py-12">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7.5" stroke="white" strokeWidth="1.8" />
                <path d="M10 6.5v3.5l2.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Q-Heal AI</span>
          </div>

          <h2 className="text-[32px] font-black text-gray-900 tracking-tight leading-tight mb-1">
            Welcome back
          </h2>
          <p className="text-gray-400 text-[15px] mb-8">Sign in to your clinic dashboard</p>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M8 5v3M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  placeholder="you@clinic.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2 shadow-md shadow-teal-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                    <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Role hints */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 font-medium text-center mb-3">Sign in as</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Patient', 'Doctor', 'Receptionist', 'Admin'].map((role) => (
                <span key={role} className="text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Navbar ── */
function Navbar({ onSignIn }: { onSignIn: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="white" strokeWidth="1.8" />
              <path d="M10 6.5v3.5l2.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-[18px] tracking-tight">Q-Heal AI</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-medium">
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button className="text-sm font-medium text-teal-700 border border-teal-600 rounded-full px-5 py-2 hover:bg-teal-50 transition-colors">
            Live Queue Dashboard
          </button>
          <button
            onClick={onSignIn}
            className="text-sm font-bold text-white bg-gray-900 rounded-full px-6 py-2 hover:bg-gray-700 transition-colors"
          >
            Sign in
          </button>
        </div>

        <button className="md:hidden text-gray-600" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen
              ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="text-sm text-gray-700 font-medium">{link}</a>
          ))}
          <button className="text-sm font-medium text-teal-700 border border-teal-600 rounded-full px-4 py-2">
            Live Queue Dashboard
          </button>
          <button onClick={onSignIn} className="text-sm font-semibold text-white bg-gray-900 rounded-full px-5 py-2">
            Sign in
          </button>
        </div>
      )}
    </nav>
  );
}

/* ── Feature Cards data ── */
const FEATURE_CARDS: FeatureCard[] = [
  {
    role: 'Patient',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="#0d9488" strokeWidth="1.5" />
        <path d="M9 6v3.5l2 2" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    iconBg: 'bg-teal-50',
    title: 'Predicted Wait Times',
    description: 'Patient sees their token number and live queue position on a screen or their phone after registering.',
  },
  {
    role: 'Doctor',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM3 15s0-4 6-4 6 4 6 4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    iconBg: 'bg-indigo-50',
    title: 'Voice-to-Prescription',
    description: 'Doctor speaks during consultation — Whisper transcribes it, LangChain structures it into diagnosis and saves.',
  },
  {
    role: 'Receptionist',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="12" rx="2" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M6 8h6M6 11h4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    iconBg: 'bg-amber-50',
    title: 'Urgency Triage',
    description: 'Receptionist assesses patient symptoms. AI recommends which to move up the queue — general physician vs specialist.',
  },
];

const SECOND_ROW_CARDS: FeatureCard[] = [
  {
    role: 'Admin',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#10b981" strokeWidth="1.5" />
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="#10b981" strokeWidth="1.5" />
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="#10b981" strokeWidth="1.5" />
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="#10b981" strokeWidth="1.5" />
      </svg>
    ),
    iconBg: 'bg-emerald-50',
    title: 'Live Queue Dashboard',
    description: 'Real-time view of all queues, doctor availability, and room status — all managed from a single admin panel.',
  },
  {
    role: 'Analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 14l4-5 4 3 4-7 2 2" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="7" r="1" fill="#3b82f6" />
      </svg>
    ),
    iconBg: 'bg-blue-50',
    title: 'Smart Insights',
    description: 'AI-powered analytics surface bottlenecks, peak hours, and patient flow patterns to optimize clinic operations.',
  },
  {
    role: 'Integration',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="4" cy="9" r="2.5" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle cx="14" cy="4" r="2.5" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="2.5" stroke="#8b5cf6" strokeWidth="1.5" />
        <path d="M6.5 9h5M11.5 4l-5 5M11.5 14l-5-5" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    iconBg: 'bg-purple-50',
    title: 'EHR Sync',
    description: 'Seamlessly connects with existing Electronic Health Record systems for instant data sync and zero duplicate entry.',
  },
];

function CardGrid({ cards }: { cards: FeatureCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.role}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center`}>
              {card.icon}
            </div>
            <span className="text-sm font-semibold text-gray-600">{card.role}</span>
          </div>
          <h3 className="text-[16px] font-bold text-gray-900 mb-2">{card.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Stats Bar ── */
function StatsBar() {
  const stats = [
    { label: 'Hospitals Onboarded', value: '120+' },
    { label: 'Daily Patients Served', value: '18,000+' },
    { label: 'Avg Wait Time Reduced', value: '62%' },
    { label: 'Prescription Accuracy', value: '99.3%' },
  ];
  return (
    <section className="bg-white border-y border-gray-100 py-10 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-3xl font-extrabold text-gray-900 mb-1">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── CTA ── */
function CTASection({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section className="bg-teal-700 py-16 px-8 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          Ready to transform your clinic?
        </h2>
        <p className="text-teal-100 text-base mb-8 leading-relaxed">
          Join hundreds of healthcare providers already using Q-Heal AI to deliver faster, smarter, and more compassionate care.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onSignIn}
            className="bg-white text-teal-800 font-bold text-sm rounded-full px-7 py-3 hover:bg-teal-50 transition-colors shadow-md"
          >
            Get Started Free
          </button>
          <button className="border border-white/40 text-white font-semibold text-sm rounded-full px-7 py-3 hover:bg-white/10 transition-colors">
            Schedule a Demo
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 px-8 py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5" />
              <path d="M9 5v4l2.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-white font-bold text-sm">Q-Heal AI</span>
        </div>
        <p className="text-xs text-gray-500">© 2025 Q-Heal AI. All rights reserved.</p>
        <div className="flex gap-6 text-xs">
          {['Privacy', 'Terms', 'Contact'].map((t) => (
            <a key={t} href="#" className="hover:text-white transition-colors">{t}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ── Root Page ── */
export default function Home() {
  useDMSans();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen antialiased bg-[#eef1f5]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Login drawer — slides in from right */}
      <LoginDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Navbar onSignIn={() => setDrawerOpen(true)} />

      {/* Hero */}
      <section className="bg-[#eef1f5] px-8 pt-12 pb-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-[52px] xl:text-[60px] font-black text-gray-900 leading-[1.06] tracking-tight mb-4 max-w-4xl">
            Reimagining the OPD<br />
            Experience with Ambient AI
          </h1>
          <p className="text-[15px] text-gray-500 mb-7 leading-relaxed max-w-lg">
            A premium, light-themed modern healthcare SaaS platform with enhanced
            adherence and improved retention ratios.
          </p>

          {/* Avatars + CTA */}
          <div className="flex items-center gap-5 flex-wrap mb-10">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                <Avatar initials="AK" color="blue" />
                <Avatar initials="SM" color="green" />
                <Avatar initials="RJ" color="purple" />
                <Avatar initials="+" color="orange" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Present your number on an Ambient AI</span>
            </div>
            <button className="bg-teal-600 hover:bg-teal-700 transition-all text-white text-sm font-bold rounded-full px-6 py-3 shadow-md hover:shadow-lg active:scale-95">
              Live Queue Dashboard
            </button>
          </div>

          <CardGrid cards={FEATURE_CARDS} />
        </div>
      </section>

      {/* Second row */}
      <section className="bg-[#eef1f5] pt-4 pb-16 px-8">
        <div className="max-w-7xl mx-auto">
          <CardGrid cards={SECOND_ROW_CARDS} />
        </div>
      </section>

      <StatsBar />
      <CTASection onSignIn={() => setDrawerOpen(true)} />
      <Footer />
    </div>
  );
}