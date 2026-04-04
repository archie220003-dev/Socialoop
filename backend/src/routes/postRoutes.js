import express from 'express';
import { createPost, getFeed, getTrending, upvotePost, downvotePost, addComment, getComments, toggleCommentLike, repostPost, getUserPosts, getUserComments, getUserReposts, toggleSavePost, getSavedPosts, getPostById, deletePost, deleteComment } from '../controllers/postController.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/', auth, upload.single('media'), createPost);
router.get('/feed', getFeed); // general feed
router.get('/trending', getTrending); // trending
router.get('/saved', auth, getSavedPosts); // must be before :id routes
router.delete('/comments/:id', auth, deleteComment);
router.post('/comments/:id/like', auth, toggleCommentLike);

router.get('/:id', getPostById); // single post by ID
router.post('/:id/upvote', auth, upvotePost);
router.post('/:id/downvote', auth, downvotePost);
router.post('/:id/repost', auth, repostPost);
router.post('/:id/save', auth, toggleSavePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/comments', auth, addComment);
router.get('/:id/comments', getComments);

// User-specific content routes
router.get('/user/:userId/posts', getUserPosts);
router.get('/user/:userId/comments', getUserComments);
router.get('/user/:userId/reposts', getUserReposts);

export default router;
