import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  title: { type: String, required: true },
  body: { type: String },
  mediaUrl: { type: String },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  repostedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  score: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);

export default Post;
export { Comment };