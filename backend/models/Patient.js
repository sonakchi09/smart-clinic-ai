const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  suggestedDoctorType: {
    type: String,
    default: ''
  },
  tokenNumber: {
    type: Number
  },
  status: {
    type: String,
    enum: ['waiting', 'in-consultation', 'done'],
    default: 'waiting'
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  consultationNotes: {
    type: String,
    default: ''
  },
  prescription: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);