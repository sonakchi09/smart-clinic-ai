'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';

export default function PatientStatusPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patients/${id}`
      );
      setData(res.data);
    } catch (err: any) {
      setError('Could not fetch patient status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socket.emit('join-patient-room', id);

    socket.on('status-update', ({ status, message }) => {
      setAlert(message);
      fetchStatus();
    });

    socket.on('your-turn', ({ message }) => {
      setAlert(message);
      fetchStatus();
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading your token status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const { patient, patientsAhead, estimatedWait } = data;

  const statusColors: Record<string, string> = {
    waiting: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'in-consultation': 'bg-blue-50 text-blue-700 border-blue-200',
    done: 'bg-green-50 text-green-700 border-green-200'
  };
  const statusColor = statusColors[patient.status] || '';

  const statusLabels: Record<string, string> = {
    waiting: 'Waiting',
    'in-consultation': 'In Consultation',
    done: 'Done'
  };
  const statusLabel = statusLabels[patient.status] || '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Smart Clinic AI</h1>
          <p className="text-gray-500 text-sm mt-1">Your token status</p>
        </div>

        {alert && (
          <div className="bg-blue-600 text-white text-sm text-center py-3 px-4 rounded-xl mb-6 font-medium">
            🔔 {alert}
          </div>
        )}

        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-blue-600 mb-2">
            #{patient.tokenNumber}
          </div>
          <p className="text-gray-600 font-medium">{patient.name}</p>
        </div>

        <div className={`border rounded-xl px-4 py-3 text-center text-sm font-medium mb-6 ${statusColor}`}>
          Status: {statusLabel}
        </div>

        {patient.status === 'waiting' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{patientsAhead}</p>
              <p className="text-xs text-gray-500 mt-1">Patients ahead</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">~{estimatedWait}</p>
              <p className="text-xs text-gray-500 mt-1">Minutes wait</p>
            </div>
          </div>
        )}

        {patient.status === 'in-consultation' && (
          <div className="bg-blue-50 rounded-xl p-4 text-center mb-6">
            <p className="text-blue-700 font-medium">Your turn! Please proceed to the doctor's cabin.</p>
          </div>
        )}

        {patient.status === 'done' && (
          <div className="bg-green-50 rounded-xl p-4 text-center mb-6">
            <p className="text-green-700 font-medium">Consultation complete. Thank you for visiting!</p>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Doctor</span>
            <span className="text-gray-800 font-medium">{patient.assignedDoctor?.name || 'Being assigned'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-800">{patient.date}</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Updates are live — no need to refresh
        </p>
      </div>
    </div>
  );
}