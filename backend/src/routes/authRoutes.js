import express from 'express';
import { register, login, getProfile, updateProfile, verifyOtp, sendLoginOtp, resendOtp } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/login-otp-request', sendLoginOtp);
router.post('/resend-otp', resendOtp);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, upload.single('avatar'), updateProfile);

export default router;
