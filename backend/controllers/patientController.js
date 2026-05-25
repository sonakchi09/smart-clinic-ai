const Patient = require('../models/Patient');
const User = require('../models/User');
const QRCode = require('qrcode');

const registerPatient = async (req, res) => {
  try {
    const { name, age, gender, phone, symptoms } = req.body;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = await Patient.countDocuments({ date: todayStr });
    const tokenNumber = todayCount + 1;

    const availableDoctors = await User.find({
      role: 'doctor',
      isAvailable: true
    });

    let assignedDoctor = null;
    if (availableDoctors.length > 0) {
      const doctorPatientCounts = await Promise.all(
        availableDoctors.map(async (doc) => {
          const count = await Patient.countDocuments({
            assignedDoctor: doc._id,
            date: todayStr,
            status: { $ne: 'done' }
          });
          return { doctor: doc, count };
        })
      );
      doctorPatientCounts.sort((a, b) => a.count - b.count);
      assignedDoctor = doctorPatientCounts[0].doctor._id;
    }

    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      symptoms,
      tokenNumber,
      assignedDoctor,
      registeredBy: req.user._id,
      date: todayStr
    });

    await patient.populate('assignedDoctor', 'name');

    const patientPageUrl = `${process.env.FRONTEND_URL}/patient/${patient._id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(patientPageUrl);

    res.status(201).json({
      message: 'Patient registered successfully',
      token: tokenNumber,
      patient,
      qrCode: qrCodeDataUrl
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPatients = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const patients = await Patient.find({ date: todayStr })
      .populate('assignedDoctor', 'name')
      .sort({ tokenNumber: 1 });
    res.json({ patients });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const patientsAhead = await Patient.countDocuments({
      date: todayStr,
      assignedDoctor: patient.assignedDoctor,
      status: 'waiting',
      tokenNumber: { $lt: patient.tokenNumber }
    });

    const avgConsultationTime = 10;
    const estimatedWait = patientsAhead * avgConsultationTime;

    res.json({ patient, patientsAhead, estimatedWait });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerPatient, getPatients, getPatientById };