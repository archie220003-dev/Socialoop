import express from 'express';
import Post from '../models/Post.js';
import {
    createPost,
    getFeed,
    getTrending,
    upvotePost,
    downvotePost,
    addComment,
    getComments,
    toggleCommentLike,
    repostPost,
    getUserPosts,
    getUserComments,
    getUserReposts,
    toggleSavePost,
    getSavedPosts,
    getPostById,
    deletePost,
    deleteComment
} from '../controllers/postController.js';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const router = express.Router();

/* -------------------- BASIC ROUTE (FIX FOR /api/posts) -------------------- */
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('author');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* -------------------- POST CREATION -------------------- */
router.post('/', auth, upload.single('media'), createPost);

/* -------------------- FEED & TRENDING -------------------- */
router.get('/feed', getFeed);
router.get('/trending', getTrending);

/* -------------------- SAVED POSTS -------------------- */
router.get('/saved', auth, getSavedPosts);

/* -------------------- COMMENT ROUTES -------------------- */
router.delete('/comments/:id', auth, deleteComment);
router.post('/comments/:id/like', auth, toggleCommentLike);

/* -------------------- USER-SPECIFIC ROUTES -------------------- */
router.get('/user/:userId/posts', getUserPosts);
router.get('/user/:userId/comments', getUserComments);
router.get('/user/:userId/reposts', getUserReposts);

/* -------------------- SINGLE POST ROUTES -------------------- */
router.get('/:id', getPostById);
router.post('/:id/upvote', auth, upvotePost);
router.post('/:id/downvote', auth, downvotePost);
router.post('/:id/repost', auth, repostPost);
router.post('/:id/save', auth, toggleSavePost);
router.delete('/:id', auth, deletePost);

/* -------------------- POST COMMENTS -------------------- */
router.post('/:id/comments', auth, addComment);
router.get('/:id/comments', getComments);

export default router;