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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-800">Smart Clinic AI — Admin</h1>
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

      <div className="max-w-6xl mx-auto mt-8 px-4 space-y-8">

        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
            {success}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Patients', value: data?.stats?.totalPatients, color: 'text-blue-600' },
            { label: 'Waiting', value: data?.stats?.waiting, color: 'text-yellow-600' },
            { label: 'In Consultation', value: data?.stats?.inConsultation, color: 'text-purple-600' },
            { label: 'Done', value: data?.stats?.done, color: 'text-green-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-gray-800">Doctors</h2>
            <button
              onClick={() => setShowAddDoctor(!showAddDoctor)}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Doctor
            </button>
          </div>

          {showAddDoctor && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Add New Doctor</h3>
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleAddDoctor} className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full name"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General Physician">General Physician</option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Orthopedic">Orthopedic</option>
                  <option value="ENT Specialist">ENT Specialist</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Gastroenterologist">Gastroenterologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="Gynecologist">Gynecologist</option>
                  <option value="Psychiatrist">Psychiatrist</option>
                </select>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="col-span-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {addLoading ? 'Adding...' : 'Add Doctor'}
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.doctorStats?.map((doc: any) => (
              <div key={doc._id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-800">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.email}</p>
                    <p className="text-xs text-blue-500">{doc.specialization || 'General Physician'}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(doc._id)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                      doc.isAvailable
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    {doc.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-800">{doc.totalPatients}</p>
                    <p className="text-xs text-gray-400">Total today</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-600">{doc.donePatients}</p>
                    <p className="text-xs text-gray-400">Completed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">Today's Patients</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Token</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Age</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Doctor</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.patients?.map((patient: any) => (
                  <tr key={patient._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-blue-600">#{patient.tokenNumber}</td>
                    <td className="px-6 py-4 text-gray-800">{patient.name}</td>
                    <td className="px-6 py-4 text-gray-500">{patient.age}</td>
                    <td className="px-6 py-4 text-gray-500">{patient.assignedDoctor?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4">{statusBadge(patient.status)}</td>
                  </tr>
                ))}
                {data?.patients?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No patients registered today
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