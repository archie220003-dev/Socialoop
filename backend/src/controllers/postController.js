import cloudinary from '../../cloudinary.js';
import Post, { Comment } from '../models/Post.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatarUrl')
      .populate('community', 'name')
      .lean();

    if (!post) return res.status(404).send({ error: 'Post not found' });

    res.send({
      ...post,
      upvotes: post.upvotedBy?.length || 0,
      downvotes: post.downvotedBy?.length || 0
    });
  } catch (error) {
    console.error("FULL ERROR (getPostById):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, body, community } = req.body;
    let mediaUrl = null;
    if (req.file && req.file.path) {
      const result = await cloudinary.uploader.upload(req.file.path);
      mediaUrl = result.secure_url;
    }

    if (community) {
      const CommunityModel = (await import('../models/Community.js')).default;
      const targetCommunity = await CommunityModel.findById(community);
      if (!targetCommunity) return res.status(404).send({ error: 'Community not found' });
      if (!targetCommunity.members.includes(req.user._id)) {
        return res.status(403).send({ error: 'Must join community to post' });
      }
    }

    const post = new Post({
      title,
      body,
      community: community || undefined,
      author: req.user._id,
      mediaUrl
    });

    await post.save();
    res.status(201).send(post);
  } catch (error) {
    console.error("FULL ERROR (createPost):", error);
    console.error("STACK:", error.stack);
    res.status(400).send({ error: error.message });
  }
};

import { getRankedFeed } from '../algorithms/FeedRanking.js';
import { getTrendingPosts } from '../algorithms/Trending.js';

export const getFeed = async (req, res) => {
  try {
    const candidatePosts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl')
      .populate('community', 'name')
      .limit(50)
      .lean();

    const formattedPosts = candidatePosts.map(post => ({
      ...post,
      upvotes: post.upvotedBy ? post.upvotedBy.length : 0,
      downvotes: post.downvotedBy ? post.downvotedBy.length : 0
    }));

    res.send(formattedPosts);
  } catch (error) {
    console.error("FULL ERROR (getFeed):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const getTrending = async (req, res) => {
  try {
    const candidatePosts = await Post.find()
      .populate('author', 'username avatarUrl')
      .populate('community', 'name')
      .sort({ createdAt: -1 })
      .limit(100) // Look at the last 100 posts for trending
      .lean();

    const formattedPosts = candidatePosts.map(post => ({
      ...post,
      upvotes: post.upvotedBy ? post.upvotedBy.length : 0,
      commentsCount: 0 // Ideally we aggregate comments, but 0 is fine for demo unless we populate
    }));

    // Use Custom DAA Time-Decay Algorithm
    const trending = getTrendingPosts(formattedPosts, 5);
    res.send(trending);
  } catch (error) {
    console.error("FULL ERROR (getTrending):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const upvotePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: 'Post not found' });

    const userId = req.user._id;
    const hasUpvoted = post.upvotedBy.includes(userId);

    if (hasUpvoted) {
      post.upvotedBy.pull(userId);
    } else {
      post.upvotedBy.push(userId);
      post.downvotedBy.pull(userId);

      // Notification
      if (post.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: 'LIKE_POST',
          post: post._id
        });
      }
    }

    await post.save();
    res.send(post);
  } catch (error) {
    console.error("FULL ERROR (upvotePost):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const downvotePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: 'Post not found' });

    const userId = req.user._id;
    const hasDownvoted = post.downvotedBy.includes(userId);

    if (hasDownvoted) {
      post.downvotedBy.pull(userId);
    } else {
      post.downvotedBy.push(userId);
      post.upvotedBy.pull(userId);
    }

    await post.save();
    res.send(post);
  } catch (error) {
    console.error("FULL ERROR (downvotePost):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { body, parentComment } = req.body;
    const comment = new Comment({
      post: req.params.id,
      author: req.user._id,
      body: body,
      parentComment: parentComment || null
    });

    await comment.save();
    await comment.populate('author', 'username avatarUrl');

    const post = await Post.findById(req.params.id);

    // Send Notification
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent && parent.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: parent.author,
          sender: req.user._id,
          type: 'REPLY_COMMENT',
          post: req.params.id
        });
      }
    } else if (post && post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'COMMENT_POST',
        post: req.params.id
      });
    }

    res.status(201).send(comment);
  } catch (error) {
    console.error("FULL ERROR (addComment):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 });
    res.send(comments);
  } catch (error) {
    console.error("FULL ERROR (getComments):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const toggleCommentLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).send({ error: 'Comment not found' });

    const userId = req.user._id;
    const hasLiked = comment.likes?.includes(userId);

    if (hasLiked) {
      comment.likes.pull(userId);
    } else {
      if (!comment.likes) comment.likes = [];
      comment.likes.push(userId);

      if (comment.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: comment.author,
          sender: userId,
          type: 'LIKE_COMMENT',
          post: comment.post
        });
      }
    }

    await comment.save();
    res.send(comment);
  } catch (error) {
    console.error("FULL ERROR (toggleCommentLike):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const repostPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: 'Post not found' });

    const userId = req.user._id;
    const hasReposted = post.repostedBy?.includes(userId);

    if (hasReposted) {
      post.repostedBy.pull(userId);
    } else {
      if (!post.repostedBy) post.repostedBy = [];
      post.repostedBy.push(userId);

      // Notification for repost
      if (post.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: 'REPOST',
          post: post._id
        });
      }
    }

    await post.save();
    res.send({ reposted: !hasReposted, repostCount: post.repostedBy.length });
  } catch (error) {
    console.error("FULL ERROR (repostPost):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl')
      .populate('community', 'name')
      .lean();

    const formatted = posts.map(p => ({
      ...p,
      upvotes: p.upvotedBy?.length || 0,
      downvotes: p.downvotedBy?.length || 0
    }));

    res.send(formatted);
  } catch (error) {
    console.error("FULL ERROR (getUserPosts):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const getUserComments = async (req, res) => {
  try {
    const comments = await Comment.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl')
      .populate({
        path: 'post',
        select: 'title author community',
        populate: [
          { path: 'author', select: 'username' },
          { path: 'community', select: 'name' }
        ]
      })
      .lean();

    res.send(comments);
  } catch (error) {
    console.error("FULL ERROR (getUserComments):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const getUserReposts = async (req, res) => {
  try {
    const posts = await Post.find({ repostedBy: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl')
      .populate('community', 'name')
      .lean();

    const formatted = posts.map(p => ({
      ...p,
      upvotes: p.upvotedBy?.length || 0,
      downvotes: p.downvotedBy?.length || 0
    }));

    res.send(formatted);
  } catch (error) {
    console.error("FULL ERROR (getUserReposts):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const toggleSavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: 'Post not found' });

    const user = await User.findById(req.user._id);
    const isSaved = user.savedPosts?.includes(post._id);

    if (isSaved) {
      user.savedPosts.pull(post._id);
    } else {
      if (!user.savedPosts) user.savedPosts = [];
      user.savedPosts.push(post._id);
    }

    await user.save();
    res.send({ saved: !isSaved });
  } catch (error) {
    console.error("FULL ERROR (toggleSavePost):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: [
        { path: 'author', select: 'username avatarUrl' },
        { path: 'community', select: 'name' }
      ]
    });

    const formattedPosts = user.savedPosts.map(post => ({
      ...post.toObject(),
      upvotes: post.upvotedBy ? post.upvotedBy.length : 0,
      downvotes: post.downvotedBy ? post.downvotedBy.length : 0
    }));

    res.send(formattedPosts);
  } catch (error) {
    console.error("FULL ERROR (getSavedPosts):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ error: 'Post not found' });
    }

    const authorId = post.author._id ? post.author._id.toString() : post.author.toString();
    if (authorId !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Unauthorized to delete this post' });
    }

    await Post.deleteOne({ _id: post._id });
    await Comment.deleteMany({ post: post._id }); // cleanup attached comments

    res.send({ success: true, message: 'Post and associated comments deleted.' });
  } catch (error) {
    console.error("FULL ERROR (deletePost):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).send({ error: 'Comment not found' });
    }

    const authorId = comment.author._id ? comment.author._id.toString() : comment.author.toString();
    if (authorId !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Unauthorized to delete this comment' });
    }

    await Comment.deleteOne({ _id: comment._id });
    res.send({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    console.error("FULL ERROR (deleteComment):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};
