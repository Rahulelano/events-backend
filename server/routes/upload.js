import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Test route to check if upload router is loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Upload router is working!' });
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dly16icr8',
  api_key: '983344653426663',
  api_secret: 'N_qZKPSDyTeJnjJUz_rygkx3lno',
});

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Upload image to Cloudinary
router.post('/image', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('Upload request received');
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log('Uploading to Cloudinary...');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'cbevent',
      resource_type: 'auto',
    });

    console.log('Upload successful:', result.secure_url);

    res.json({ 
      success: true, 
      image_url: result.secure_url,
      public_id: result.public_id 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

export default router; 
