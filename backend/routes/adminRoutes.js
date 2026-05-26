const express = require('express');
const router = express.Router();
const { getDashboardStats, addDoctor, toggleDoctorAvailability } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorizeRoles('admin'), getDashboardStats);
router.post('/add-doctor', protect, authorizeRoles('admin'), addDoctor);
router.put('/doctor/:id/toggle', protect, authorizeRoles('admin'), toggleDoctorAvailability);

module.exports = router;