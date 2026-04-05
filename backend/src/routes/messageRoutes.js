import express from 'express';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/multer.js';
import { getConversations, getMessages, sendMessage, getOrCreateConversation, deleteConversation, getUnreadCount } from '../controllers/messageController.js';

const router = express.Router();

router.get('/conversations', auth, getConversations);
router.get('/unread-count', auth, getUnreadCount);
router.post('/conversation/:targetUserId', auth, getOrCreateConversation);
router.get('/:conversationId', auth, getMessages);
router.post('/:conversationId', auth, upload.single('media'), sendMessage);
router.delete('/:conversationId', auth, deleteConversation);

export default router;
