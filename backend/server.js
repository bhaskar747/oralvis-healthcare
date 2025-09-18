require('dotenv').config();
console.log('AWS Region on startup:', process.env.AWS_REGION);
console.log('Bucket Name on startup:', process.env.AWS_S3_BUCKET_NAME);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const app = express();


app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));


app.use('/api/auth', require('./routes/auth'));
app.use('/api/submissions', require('./routes/submissions'));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
