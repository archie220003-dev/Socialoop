import express from 'express';
import { getUserProfile, toggleFollow } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', getUserProfile);
router.post('/:id/follow', auth, toggleFollow);

export default router;
