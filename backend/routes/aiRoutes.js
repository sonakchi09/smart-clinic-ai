const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { suggestDoctor, generatePreConsultationSummary, generateDashboardInsights, structurePrescription } = require('../services/aiService');
const multer = require('multer');
const { transcribeAudio } = require('../services/aiService');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/suggest-doctor', protect, authorizeRoles('receptionist'), async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || symptoms.length < 5) {
      return res.status(400).json({ message: 'Please enter more details about symptoms' });
    }
    const suggestion = await suggestDoctor(symptoms);
    res.json({ suggestion });
  } catch (error) {
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
});

router.post('/pre-consultation', protect, authorizeRoles('doctor'), async (req, res) => {
  try {
    const { patient } = req.body;
    const summary = await generatePreConsultationSummary(patient);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
});

router.get('/dashboard-insights', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { stats } = req.query;
    const parsedStats = JSON.parse(stats);
    const insights = await generateDashboardInsights(parsedStats);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
});

router.post('/structure-prescription', protect, authorizeRoles('doctor'), async (req, res) => {
  try {
    const { transcript } = req.body;
    const structured = await structurePrescription(transcript);
    res.json({ structured });
  } catch (error) {
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
});

router.post('/transcribe', protect, authorizeRoles('doctor'), upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);

    if (!transcript) {
      return res.status(500).json({ message: 'Transcription failed' });
    }

    const structured = await structurePrescription(transcript);

    res.json({ transcript, structured });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;