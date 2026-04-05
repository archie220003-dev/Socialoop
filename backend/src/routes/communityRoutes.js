import express from 'express';
import { createCommunity, getCommunities, getCommunityById, getCommunityPosts, joinCommunity, leaveCommunity, updateCommunityAvatar, updateCommunity, removeMember } from '../controllers/communityController.js';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/', auth, createCommunity);
router.get('/', getCommunities);
router.get('/:id', getCommunityById);
router.get('/:id/posts', getCommunityPosts);
router.post('/:id/join', auth, joinCommunity);
router.post('/:id/leave', auth, leaveCommunity);
router.put('/:id', auth, updateCommunity);
router.put('/:id/avatar', auth, upload.single('avatar'), updateCommunityAvatar);
router.delete('/:id/members/:memberId', auth, removeMember);

export default router;
