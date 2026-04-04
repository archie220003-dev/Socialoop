import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['LIKE_POST', 'COMMENT_POST', 'REPLY_COMMENT', 'LIKE_COMMENT', 'FOLLOW', 'REPOST'], required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // Optional, linking context
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', notificationSchema);
