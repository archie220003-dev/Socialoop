import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../../cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'socialoop',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});

export const upload = multer({ storage });