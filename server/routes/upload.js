import express from 'express';
import multer from 'multer';
import { uploadImage, getOptimizedImageUrl } from '../config/cloudinary.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Upload single image
router.post('/image', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const imageUrl = await uploadImage(base64Image, 'cbevent');
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      optimizedUrl: getOptimizedImageUrl(imageUrl, 800, 600)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple images
router.post('/images', authenticateAdmin, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const imageUrl = await uploadImage(base64Image, 'cbevent');
      return {
        originalName: file.originalname,
        imageUrl: imageUrl,
        optimizedUrl: getOptimizedImageUrl(imageUrl, 800, 600)
      };
    });

    const results = await Promise.all(uploadPromises);
    
    res.json({
      success: true,
      images: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Get optimized image URL
router.get('/optimize', (req, res) => {
  try {
    const { url, width = 800, height = 600 } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const optimizedUrl = getOptimizedImageUrl(url, parseInt(width), parseInt(height));
    
    res.json({
      success: true,
      originalUrl: url,
      optimizedUrl: optimizedUrl
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize image' });
  }
});

export default router; 