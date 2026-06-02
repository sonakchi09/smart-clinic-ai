'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { motion, useInView, AnimatePresence } from 'framer-motion';

function useDMSans() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);
}

const NAV_LINKS: string[] = ['Features', 'How it Works', 'Demo'];
type AvatarColor = 'blue' | 'green' | 'purple' | 'orange';
interface AvatarProps { initials: string; color: AvatarColor; }
interface FeatureCardData { role: string; icon: ReactNode; iconBg: string; title: string; description: string; }

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

  const quickFill = (role: string) => {
    const accounts: Record<string, { email: string; password: string }> = {
      Admin: { email: 'admin@clinic.com', password: 'admin123' },
      Doctor: { email: 'doctor@clinic.com', password: 'doctor123' },
      Receptionist: { email: 'receptionist@clinic.com', password: 'recept123' },
    };
    if (accounts[role]) {
      setEmail(accounts[role].email);
      setPassword(accounts[role].password);
      setError('');
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 h-full z-50 w-full max-w-[440px] bg-[#eef1f5] shadow-2xl flex flex-col"
      >
        <div className="h-1.5 w-full bg-teal-600" />
        <div className="flex-1 flex flex-col justify-center px-10 py-12">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3v5l3 3-1.5 1.5L8 11V5h2z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Smart Clinic AI</span>
          </div>

          <h2 className="text-[32px] font-black text-gray-900 tracking-tight leading-tight mb-1">Welcome back</h2>
          <p className="text-gray-400 text-[15px] mb-6">Sign in to your clinic dashboard</p>

          <div className="mb-6">
            <p className="text-xs text-gray-400 font-medium mb-2">Quick demo access</p>
            <div className="flex gap-2">
              {[
                { role: 'Admin', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                { role: 'Doctor', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                { role: 'Receptionist', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
              ].map(({ role, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => quickFill(role)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${color}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 mt-2 flex items-center justify-center gap-2 shadow-md shadow-teal-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                    <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Signing in...
                </>
              ) : <>Sign in <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></>}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
}

function Navbar({ onSignIn }: { onSignIn: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`w-full bg-white sticky top-0 z-30 transition-shadow duration-300 ${scrolled ? 'shadow-md border-b border-gray-100' : 'border-b border-gray-100'}`}
    >
      <div className="max-w-7xl mx-auto px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3v5l3 3-1.5 1.5L8 11V5h2z" fill="white"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-[18px] tracking-tight">Smart Clinic AI</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-medium">
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSignIn}
            className="text-sm font-bold text-white bg-gray-900 rounded-full px-6 py-2 hover:bg-gray-700 transition-colors"
          >
            Sign in
          </motion.button>
        </div>

        <button className="md:hidden text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 overflow-hidden"
          >
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="text-sm text-gray-700 font-medium">{link}</a>
            ))}
            <button onClick={onSignIn} className="text-sm font-semibold text-white bg-gray-900 rounded-full px-5 py-2">
              Sign in
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

const FEATURE_CARDS: FeatureCardData[] = [
  {
    role: 'Patient',
    icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#0d9488" strokeWidth="1.5" /><path d="M9 6v3.5l2 2" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" /></svg>),
    iconBg: 'bg-teal-50',
    title: 'Live Token & Wait Time',
    description: 'Patient scans QR code at reception and tracks their queue position and estimated wait time live on their phone.',
  },
  {
    role: 'Doctor',
    icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM3 15s0-4 6-4 6 4 6 4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" /></svg>),
    iconBg: 'bg-indigo-50',
    title: 'Voice-to-Prescription',
    description: 'Doctor speaks during consultation — Whisper AI transcribes and structures it into diagnosis, medicines, and follow-up instantly.',
  },
  {
    role: 'Receptionist',
    icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="#f59e0b" strokeWidth="1.5" /><path d="M6 8h6M6 11h4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" /></svg>),
    iconBg: 'bg-amber-50',
    title: 'AI Symptom Triage',
    description: 'AI analyzes symptoms in real time and suggests the right specialist and urgency level — Low, Medium, or High — as receptionist types.',
  },
];

const SECOND_ROW_CARDS: FeatureCardData[] = [
  {
    role: 'Admin',
    icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#10b981" strokeWidth="1.5" /><rect x="10" y="2" width="6" height="6" rx="1.5" stroke="#10b981" strokeWidth="1.5" /><rect x="2" y="10" width="6" height="6" rx="1.5" stroke="#10b981" strokeWidth="1.5" /><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="#10b981" strokeWidth="1.5" /></svg>),
    iconBg: 'bg-emerald-50',
    title: 'Smart Admin Dashboard',
    description: 'Real-time view of all patient queues, doctor availability, workload balancing alerts, and AI-generated daily insights.',
  },
  {
    role: 'Real-time',
    icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-5 4 3 4-7 2 2" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="16" cy="7" r="1" fill="#3b82f6" /></svg>),
    iconBg: 'bg-blue-50',
    title: 'Socket.io Live Updates',
    description: 'Queue updates, cabin call alerts, and status changes push instantly across all dashboards — no refresh needed anywhere.',
  },
  {
    role: 'PDF',
    icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="1" width="12" height="16" rx="2" stroke="#8b5cf6" strokeWidth="1.5" /><path d="M6 6h6M6 9h6M6 12h4" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" /></svg>),
    iconBg: 'bg-purple-50',
    title: 'Prescription PDF',
    description: 'After consultation, patients download a professionally formatted prescription PDF directly from their token status page.',
  },
];

function AnimatedCard({ card, index }: { card: FeatureCardData; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-default"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center`}>
          {card.icon}
        </div>
        <span className="text-sm font-semibold text-gray-600">{card.role}</span>
      </div>
      <h3 className="text-[16px] font-bold text-gray-900 mb-2">{card.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
    </motion.div>
  );
}

function CardGrid({ cards }: { cards: FeatureCardData[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <AnimatedCard key={card.role} card={card} index={index} />
      ))}
    </div>
  );
}

function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const stats = [
    { label: 'Role-based Dashboards', value: '4' },
    { label: 'AI Features Built', value: '6+' },
    { label: 'Real-time Updates', value: '⚡' },
    { label: 'Stack', value: 'Next.js + Groq' },
  ];

  return (
    <section ref={ref} className="bg-white border-y border-gray-100 py-10 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <div className="text-3xl font-extrabold text-gray-900 mb-1">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CTASection({ onSignIn }: { onSignIn: () => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="bg-teal-700 py-16 px-8 text-center">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight"
        >
          See it live — takes 30 seconds
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-teal-100 text-base mb-8 leading-relaxed"
        >
          Sign in as Admin, Doctor, or Receptionist and explore the full AI-powered clinic workflow.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSignIn}
            className="bg-white text-teal-800 font-bold text-sm rounded-full px-7 py-3 hover:bg-teal-50 transition-colors shadow-md"
          >
            Sign in to Demo
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

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
          <span className="text-white font-bold text-sm">Smart Clinic AI</span>
        </div>
        <p className="text-xs text-gray-500">Built by Sonakchi Kumari · KIIT 2027</p>
        <div className="flex gap-6 text-xs">
          {['GitHub', 'LinkedIn', 'Contact'].map((t) => (
            <a key={t} href="#" className="hover:text-white transition-colors">{t}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  useDMSans();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen antialiased bg-[#eef1f5]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <LoginDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <Navbar onSignIn={() => setDrawerOpen(true)} />

      <section className="bg-[#eef1f5] px-8 pt-12 pb-0">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-[52px] xl:text-[60px] font-black text-gray-900 leading-[1.06] tracking-tight mb-4 max-w-4xl"
          >
            Reimagining the OPD<br />
            <span className="text-teal-600">Experience with Ambient AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[15px] text-gray-500 mb-7 leading-relaxed max-w-lg"
          >
            A full-stack AI-powered clinic management system with real-time queues, voice-to-prescription, and intelligent patient triage — built for modern healthcare.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex items-center gap-5 flex-wrap mb-10"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                <Avatar initials="AD" color="blue" />
                <Avatar initials="DR" color="green" />
                <Avatar initials="RC" color="purple" />
                <Avatar initials="PT" color="orange" />
              </div>
              <span className="text-sm text-gray-500 font-medium">4 role-based dashboards — Admin, Doctor, Receptionist, Patient</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setDrawerOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 transition-colors text-white text-sm font-bold rounded-full px-6 py-3 shadow-md"
            >
              Try Live Demo →
            </motion.button>
          </motion.div>

          <CardGrid cards={FEATURE_CARDS} />
        </div>
      </section>

      <section className="bg-[#eef1f5] pt-4 pb-16 px-8">
        <div className="max-w-7xl mx-auto">
          <CardGrid cards={SECOND_ROW_CARDS} />
        </div>
      </section>

      {/* <StatsBar />
      <CTASection onSignIn={() => setDrawerOpen(true)} /> */}
      <Footer />
    </div>
  );
}