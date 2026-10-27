const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', async (req, res, next) => {
  try {
    const { fileName, fileData, fileType } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        message: 'File name and file content (base64) are required',
      });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Extract base64 payload if it includes data URI prefix
    let base64Payload = fileData;
    let mimeType = fileType || '';

    if (fileData.includes(';base64,')) {
      const parts = fileData.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Payload = parts[1];
    }

    // Determine extension and resourceType
    let ext = path.extname(fileName).toLowerCase();
    if (!ext) {
      if (mimeType.includes('pdf')) ext = '.pdf';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
      else if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';
      else ext = '.bin';
    }

    let resourceType = 'link';
    if (ext === '.pdf' || mimeType.includes('pdf')) {
      resourceType = 'pdf';
    } else if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext) || mimeType.startsWith('image/')) {
      resourceType = 'image';
    }

    // Sanitize filename
    const safeBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storedFileName = `${Date.now()}-${safeBase}${ext}`;
    const destinationPath = path.join(uploadsDir, storedFileName);

    // Write binary buffer to disk
    const buffer = Buffer.from(base64Payload, 'base64');
    fs.writeFileSync(destinationPath, buffer);

    const host = req.get('host') || 'localhost:5001';
    const protocol = req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/${storedFileName}`;

    res.status(201).json({
      success: true,
      url: fileUrl,
      relativeUrl: `/uploads/${storedFileName}`,
      fileName: fileName,
      resourceType,
      sizeBytes: buffer.length,
      message: `File "${fileName}" uploaded successfully`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
