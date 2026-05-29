const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { generatePrescriptionPDF } = require('../services/pdfService');
const { 
  registerPatient, 
  getPatients, 
  getPatientById,
  getDoctorPatients,
  updateConsultation
} = require('../controllers/patientController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/register', protect, authorizeRoles('receptionist'), registerPatient);
router.get('/', protect, authorizeRoles('receptionist', 'admin', 'doctor'), getPatients);
router.get('/my-patients', protect, authorizeRoles('doctor'), getDoctorPatients);
router.get('/:id', getPatientById);
router.put('/:id/consultation', protect, authorizeRoles('doctor'), updateConsultation);
router.get('/:id/prescription-pdf', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.status !== 'done') {
      return res.status(400).json({ message: 'Consultation not completed yet' });
    }

    const doctorName = patient.assignedDoctor?.name || 'N/A';
    const pdfBuffer = await generatePrescriptionPDF(patient, doctorName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${patient.tokenNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
module.exports = router;