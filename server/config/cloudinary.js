import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dly16icr8',
  api_key: '983344653426663',
  api_secret: 'N_qZKPSDyTeJnjJUz_rygkx3lno',
});

export default cloudinary;

// Helper function to upload image
export const uploadImage = async (file, folder = 'cbevent') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' }
      ]
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

// Helper function to delete image
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

// Helper function to get optimized image URL
export const getOptimizedImageUrl = (url, width = 800, height = 600) => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  // Transform Cloudinary URL for optimization
  const baseUrl = url.split('/upload/')[0] + '/upload/';
  const imagePath = url.split('/upload/')[1];
  
  return `${baseUrl}c_fill,w_${width},h_${height},q_auto/${imagePath}`;
}; 
