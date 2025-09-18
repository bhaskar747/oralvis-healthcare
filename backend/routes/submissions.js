const express = require('express');
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const path = require('path');

const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const { uploadPdfToS3 } = require('../services/pdfService'); 

const router = express.Router();

// --- S3 and Multer Configuration ---
const s3 = new S3Client({
    region: process.env.AWS_S3_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `images/${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    })
});

// ROUTE: POST /api/submissions/upload
router.post('/upload', auth, upload.single('image'), async (req, res) => {
    if (req.user.role !== 'patient') {
        return res.status(403).json({ message: 'Access denied' });
    }
    if (!req.file) {
        return res.status(400).json({ message: 'Image file is required.' });
    }

    const { note } = req.body;
    const submission = new Submission({
        // The user's MongoDB ID is available as `_id` on the req.user object
        patientId: req.user._id, 
        patientDetails: { 
            name: req.user.name,
            email: req.user.email,
            // --- THIS IS THE FIX ---
            // Use the main user ID (`_id`) for the patientId field here as well.
            patientId: req.user._id,
            note: note,
        },
        originalImageUrl: req.file.location, 
    });

    try {
        await submission.save();
        res.status(201).json(submission);
    } catch (error) {
        console.error("Submission save error:", error);
        res.status(500).json({ message: 'Failed to save submission.', error: error.message });
    }
});

// ROUTE: PUT /api/submissions/:id/annotate
router.put('/:id/annotate', auth, upload.single('annotatedImage'), async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    
    const { annotations } = req.body;
    const annotatedImageUrl = req.file ? req.file.location : null; 

    const submission = await Submission.findByIdAndUpdate(
        req.params.id,
        { 
            annotations: annotations, 
            annotatedImageUrl: annotatedImageUrl, 
            status: 'processed'
        },
        { new: true }
    );
    res.json(submission);
});

// ROUTE: POST /api/submissions/:id/generate-pdf
router.post('/:id/generate-pdf', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        const pdfUrl = await uploadPdfToS3(submission);
        
        submission.reportUrl = pdfUrl; 
        submission.status = 'processed';
        await submission.save();

        res.json({ message: 'PDF generated and uploaded to S3', reportUrl: pdfUrl });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'Failed to generate PDF report.' });
    }
});

// ROUTE: PATCH api/submissions/:id/reject
router.patch('/:id/reject', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.status = 'rejected';
        await submission.save();

        res.json({ message: 'Submission has been rejected successfully.' });
    } catch (error) {
        console.error('Error rejecting submission:', error);
        res.status(500).json({ message: 'Server error while rejecting submission.' });
    }
});

// ROUTE: GET /api/submissions/admin/all
router.get('/admin/all', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json(submissions);
});

// ROUTE: GET /api/submissions/patient/my
router.get('/patient/my', auth, async (req, res) => {
    // Correctly reference the main user ID from the middleware
    const submissions = await Submission.find({ patientId: req.user._id }).sort({ createdAt: -1 });
    res.json(submissions);
});

// ROUTE: GET /api/submissions/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    // Correctly reference the main user ID from the middleware
    if (req.user.role !== 'admin' && submission.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(submission);
  } catch (error) {
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
