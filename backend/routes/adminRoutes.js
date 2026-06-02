const express = require('express');
const router = express.Router();
const { getDashboardStats, addDoctor, toggleDoctorAvailability,reassignPatient } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorizeRoles('admin'), getDashboardStats);
router.post('/add-doctor', protect, authorizeRoles('admin'), addDoctor);
router.put('/doctor/:id/toggle', protect, authorizeRoles('admin'), toggleDoctorAvailability);
router.put('/patient/:id/reassign', protect, authorizeRoles('admin'), reassignPatient);

module.exports = router;