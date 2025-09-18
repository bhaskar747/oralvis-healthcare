const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'admin'], default: 'patient' },
  patientId: { type: String, unique: true, sparse: true } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
