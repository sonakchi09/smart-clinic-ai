const User = require('../models/User');
const Patient = require('../models/Patient');

const getDashboardStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const totalPatients = await Patient.countDocuments({ date: todayStr });
    const waiting = await Patient.countDocuments({ date: todayStr, status: 'waiting' });
    const inConsultation = await Patient.countDocuments({ date: todayStr, status: 'in-consultation' });
    const done = await Patient.countDocuments({ date: todayStr, status: 'done' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const availableDoctors = await User.countDocuments({ role: 'doctor', isAvailable: true });

    const doctors = await User.find({ role: 'doctor' }).select('-password');
    const doctorStats = await Promise.all(
      doctors.map(async (doc) => {
        const count = await Patient.countDocuments({
          assignedDoctor: doc._id,
          date: todayStr
        });
        const doneCount = await Patient.countDocuments({
          assignedDoctor: doc._id,
          date: todayStr,
          status: 'done'
        });
        return {
          _id: doc._id,
          name: doc.name,
          email: doc.email,
          isAvailable: doc.isAvailable,
          totalPatients: count,
          donePatients: doneCount
        };
      })
    );

    const patients = await Patient.find({ date: todayStr })
      .populate('assignedDoctor', 'name')
      .sort({ tokenNumber: 1 });

    res.json({
      stats: { totalPatients, waiting, inConsultation, done, totalDoctors, availableDoctors },
      doctorStats,
      patients
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Doctor already exists' });
    }

    const user = new User({ 
      name, 
      email, 
      password, 
      role: 'doctor',
      specialization: specialization || 'General Physician'
    });
    await user.save();

    res.status(201).json({
      message: 'Doctor added successfully',
      doctor: { id: user._id, name: user.name, email: user.email, specialization: user.specialization }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const toggleDoctorAvailability = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();

    res.json({
      message: `Doctor marked as ${doctor.isAvailable ? 'available' : 'unavailable'}`,
      isAvailable: doctor.isAvailable
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardStats, addDoctor, toggleDoctorAvailability };