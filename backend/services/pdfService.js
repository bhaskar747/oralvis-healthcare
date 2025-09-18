const PDFDocument = require('pdfkit');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- S3 CLIENT INITIALIZATION ---
const s3 = new S3Client({
    // Using AWS_REGION as defined in your .env file
    region: process.env.AWS_REGION, 
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// --- HELPER TO FETCH IMAGES ---
const fetchImage = async (url) => {
    if (!url) return null;
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer'
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching image from ${url}:`, error.message);
        return null;
    }
};

// --- PDF GENERATION HELPERS (REDESIGNED) ---

function generateHeader(doc) {
    const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 40, { width: 100 });
    }
    
    doc.fillColor('#1F4E79')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('Oral Health Evaluation Report', 160, 55, { align: 'right' });

    doc.moveTo(40, 100)
       .lineTo(555, 100)
       .lineWidth(1.5)
       .stroke('#1F4E79');
}

function generatePatientInfo(doc, submission) {
    doc.moveDown(2);
    const infoTop = doc.y;

    doc.fillColor('#333333').fontSize(11).font('Helvetica-Bold');
    doc.text('Patient Name:', 50, infoTop);
    doc.font('Helvetica').text(submission.patientDetails.name, 160, infoTop);

    doc.font('Helvetica-Bold').text('Submission Date:', 50, infoTop + 20);
    doc.font('Helvetica').text(new Date(submission.createdAt).toLocaleDateString(), 160, infoTop + 20);

    doc.font('Helvetica-Bold').text('Submission ID:', 50, infoTop + 40);
    doc.font('Helvetica').text(submission._id.toString().slice(-8), 160, infoTop + 40);

    doc.moveDown(4);

    doc.fillColor('#1F4E79').fontSize(14).font('Helvetica-Bold').text("Patient's Note");
    doc.moveTo(50, doc.y).lineTo(150, doc.y).lineWidth(1).stroke('#1F4E79');
    doc.moveDown();

    const noteText = submission.patientDetails.note || 'No note was provided.';
    doc.fillColor('#555555').fontSize(10).font('Helvetica').text(noteText, {
        width: 480,
        align: 'justify'
    });
}

function generateFindings(doc) {
    doc.moveDown(3);
    doc.fillColor('#1F4E79').fontSize(14).font('Helvetica-Bold').text('Preliminary Observations & Recommendations');
    doc.moveTo(50, doc.y).lineTo(380, doc.y).lineWidth(1).stroke('#1F4E79');
    doc.moveDown();

    const recommendations = [
        { issue: 'Visible Decay / Cavities', treatment: 'Restorative work such as fillings may be required. An in-person dental visit is highly recommended.' },
        { issue: 'Gingival Inflammation', treatment: 'Indicates potential gingivitis. We recommend professional scaling and a review of your oral hygiene routine.' },
        { issue: 'Dental Stains', treatment: 'Most external stains can be removed with professional teeth cleaning (prophylaxis).' },
        { issue: 'Tooth Wear (Attrition)', treatment: 'A protective restoration or a custom night guard may be necessary to prevent further damage.' },
    ];
    
    doc.font('Helvetica').fontSize(10);
    recommendations.forEach(rec => {
        doc.circle(55, doc.y + 6, 2.5).fill('#1F4E79');
        doc.fillColor('#333333').font('Helvetica-Bold').text(rec.issue, 70, doc.y, { continued: true }).font('Helvetica').text(`: ${rec.treatment}`);
        doc.moveDown(1);
    });
}

function generateFooter(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.moveTo(50, 780).lineTo(550, 780).lineWidth(0.5).stroke('#e0e0e0');
        doc.fontSize(8).fillColor('#757575')
           .text(`OralVis Healthcare (c) ${new Date().getFullYear()} | This is a preliminary evaluation, not a final diagnosis.`, 50, 790, { align: 'center' });
    }
}

const generatePdfToBuffer = (submission, originalImageBuffer, annotatedImageBuffer) => {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Page 1: Main Report
        generateHeader(doc);
        generatePatientInfo(doc, submission);
        generateFindings(doc);
        
        // Page 2: Images
        doc.addPage();
        generateHeader(doc);
        doc.fillColor('#1F4E79').fontSize(14).font('Helvetica-Bold').text('Submitted Images', 50, 120);

        if (originalImageBuffer) {
            doc.font('Helvetica-Bold').fontSize(11).text('Original Submission', 50, 150);
            doc.image(originalImageBuffer, 50, 170, { width: 240 });
        }
        
        if (annotatedImageBuffer) {
            doc.font('Helvetica-Bold').fontSize(11).text("Doctor's Annotated Review", 310, 150);
            doc.image(annotatedImageBuffer, 310, 170, { width: 240 });
        }
        
        generateFooter(doc);
        doc.end();
    });
};

// --- MAIN EXPORTED FUNCTION ---
const uploadPdfToS3 = async (submission) => {
    const originalImageBuffer = await fetchImage(submission.originalImageUrl);
    const annotatedImageBuffer = await fetchImage(submission.annotatedImageUrl);
    
    const pdfBuffer = await generatePdfToBuffer(submission, originalImageBuffer, annotatedImageBuffer);
    
    const pdfKey = `reports/report-${submission._id}-${Date.now()}.pdf`;
    
    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: pdfKey,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
    };
    
    try {
        await s3.send(new PutObjectCommand(uploadParams));
        
        // --- FINAL FIX for the download link ---
        // Using the standard S3 virtual-hosted-style URL format. This is the most reliable.
        return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfKey}`;
    } catch (err) {
        console.error("Error uploading PDF to S3", err);
        throw err;
    }
};

module.exports = { uploadPdfToS3 };
