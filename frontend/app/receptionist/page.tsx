'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ReceptionistPage() {
  const { token, user, logout } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    symptoms: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const typingTimer = useRef<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'symptoms') {
      clearTimeout(typingTimer.current);
      setAiSuggestion(null);
      if (value.length > 10) {
        typingTimer.current = setTimeout(() => {
          fetchAiSuggestion(value);
        }, 1000);
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const urgencyColor: Record<string, string> = {
    Low: 'bg-green-50 text-green-700 border-green-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    High: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-800">Smart Clinic AI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Receptionist: {user?.name}</span>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto mt-10 px-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Register New Patient</h2>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex items-start gap-6">
            <div>
              <p className="text-green-700 font-semibold text-lg mb-1">
                Token #{result.token} Generated!
              </p>
              <p className="text-green-600 text-sm mb-1">Patient: {result.patient.name}</p>
              <p className="text-green-600 text-sm mb-3">
                Assigned Doctor: {result.patient.assignedDoctor?.name || 'To be assigned'}
              </p>
              <p className="text-gray-500 text-xs">
                Patient can scan the QR code to track their queue status
              </p>
            </div>
            {result.qrCode && (
              <img
                src={result.qrCode}
                alt="Patient QR Code"
                className="w-32 h-32 rounded-lg border border-green-200"
              />
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Age"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
              <textarea
                name="symptoms"
                value={form.symptoms}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe symptoms... AI will suggest the right doctor"
                rows={3}
                required
              />

              {aiLoading && (
                <p className="text-xs text-blue-500 mt-2">AI is analyzing symptoms...</p>
              )}

              {aiSuggestion && !aiLoading && (
                <div className={`mt-3 border rounded-xl p-4 ${urgencyColor[aiSuggestion.urgency]}`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold">
                      AI Suggests: {aiSuggestion.doctorType}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${urgencyColor[aiSuggestion.urgency]}`}>
                      {aiSuggestion.urgency} Urgency
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-80">{aiSuggestion.reason}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Patient & Generate Token'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}