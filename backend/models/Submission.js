const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientDetails: {
    name: { type: String, required: true },
    patientId: { type: String, required: true },
    email: { type: String, required: true },
    note: String
  },
  originalImageUrl: { type: String, required: true },
  annotatedImageUrl: String,
  annotations: { type: String, default: '[]' }, 
  status: {
    type: String,
    // === THE FIX IS HERE ===
    // We are updating the list of allowed statuses to match the application's logic.
    enum: ['pending', 'processed', 'rejected'],
    default: 'pending' // 'pending' is a better default than 'uploaded'.
  },
  reportUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
