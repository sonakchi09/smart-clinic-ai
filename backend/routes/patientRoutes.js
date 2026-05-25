const express = require('express');
const router = express.Router();
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

module.exports = router;