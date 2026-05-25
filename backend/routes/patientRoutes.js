const express = require('express');
const router = express.Router();
const { registerPatient, getPatients, getPatientById } = require('../controllers/patientController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/register', protect, authorizeRoles('receptionist'), registerPatient);
router.get('/', protect, authorizeRoles('receptionist', 'admin', 'doctor'), getPatients);
router.get('/:id', getPatientById);

module.exports = router;