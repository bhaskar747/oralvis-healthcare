require('dotenv').config();
console.log('AWS Region on startup:', process.env.AWS_REGION);
console.log('Bucket Name on startup:', process.env.AWS_S3_BUCKET_NAME);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- FINAL, BEST-PRACTICE CORS CONFIGURATION ---
// This list now reads the production URL from an environment variable.
const allowedOrigins = [
  'http://localhost:3000', // For local development
  process.env.FRONTEND_URL  // For the live Vercel deployment
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/submissions', require('./routes/submissions'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
