import { Conversation, Message } from '../models/Message.js';
import User from '../models/User.js';
import cloudinary from '../../cloudinary.js';

// Helper: Deduplicate conversations for a user
// Merges messages from duplicate conversations into one and deletes extras
const deduplicateConversations = async (userId) => {
  try {
    const conversations = await Conversation.find({ participants: userId });

    // Group conversations by participant pair
    const pairMap = new Map();
    for (const conv of conversations) {
      // Create a sorted key from participants
      const key = conv.participants
        .map(p => p.toString())
        .sort()
        .join('-');

      if (!pairMap.has(key)) {
        pairMap.set(key, []);
      }
      pairMap.get(key).push(conv);
    }

    // For each pair that has duplicates, merge into one
    for (const [key, convs] of pairMap.entries()) {
      if (convs.length <= 1) continue;

      // Keep the conversation with the most recent activity (by updatedAt)
      convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const keeper = convs[0];
      const duplicates = convs.slice(1);

      for (const dup of duplicates) {
        // Move all messages from duplicate to keeper
        await Message.updateMany(
          { conversationId: dup._id },
          { $set: { conversationId: keeper._id } }
        );
        // Delete the duplicate conversation
        await Conversation.findByIdAndDelete(dup._id);
      }

      // Update the keeper's lastMessage to the most recent message
      const latestMsg = await Message.findOne({ conversationId: keeper._id })
        .sort({ createdAt: -1 });
      if (latestMsg) {
        keeper.lastMessage = latestMsg._id;
        await keeper.save();
      }

      console.log(`Merged ${duplicates.length} duplicate conversation(s) for pair: ${key}`);
    }
  } catch (err) {
    console.error('Deduplication error:', err);
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Run deduplication first
    await deduplicateConversations(userId);

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'username avatarUrl')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.send(conversations);
  } catch (err) {
    console.error("FULL ERROR (getConversations):", err);
    console.error("STACK:", err.stack);
    res.status(500).send({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is in conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).send({ error: 'Conversation not found' });
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).send({ error: 'Access denied' });
    }

    // Mark as read: messages in this conversation where current user is NOT the sender
    await Message.updateMany(
      { conversationId, sender: { $ne: req.user._id }, read: false },
      { $set: { read: true } }
    );

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username avatarUrl')
      .sort({ createdAt: 1 });

    res.send(messages);
  } catch (err) {
    console.error("FULL ERROR (getMessages):", err);
    console.error("STACK:", err.stack);
    res.status(500).send({ error: err.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId });
    if (!conversations.length) return res.send({ count: 0 });

    const convIds = conversations.map(c => c._id);

    const count = await Message.countDocuments({
      conversationId: { $in: convIds },
      sender: { $ne: userId },
      read: false
    });

    res.send({ count });
  } catch (err) {
    console.error("FULL ERROR (getUnreadCount):", err);
    console.error("STACK:", err.stack);
    res.status(500).send({ error: err.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    let mediaUrl = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      mediaUrl = result.secure_url;
    }

    if (!text && !mediaUrl) {
      return res.status(400).send({ error: 'Message must have text or media' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).send({ error: 'Conversation not found' });
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).send({ error: 'Access denied' });
    }

    const message = new Message({
      conversationId,
      sender: req.user._id,
      text,
      mediaUrl
    });

    await message.save();

    conversation.lastMessage = message._id;
    await conversation.save();

    await message.populate([
      { path: 'sender', select: 'username avatarUrl' },
      { path: 'conversationId', select: 'participants' }
    ]);

    res.status(201).send(message);
  } catch (err) {
    console.error("FULL ERROR (sendMessage):", err);
    console.error("STACK:", err.stack);
    res.status(500).send({ error: err.message });
  }
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    if (userId.toString() === targetUserId.toString()) {
      return res.status(400).send({ error: 'Cannot message yourself' });
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).send({ error: 'User not found' });
    }

    // Find ANY existing conversation between these two users
    let conversation = await Conversation.findOne({
      $and: [
        { participants: userId },
        { participants: targetUserId }
      ]
    }).populate('participants', 'username avatarUrl').populate('lastMessage');

    // Create if not exists
    if (!conversation) {
      // Sort participants for consistent ordering (pre-save hook also does this)
      const sortedParticipants = [userId, targetUserId].sort((a, b) =>
        a.toString().localeCompare(b.toString())
      );

      conversation = new Conversation({
        participants: sortedParticipants
      });
      await conversation.save();
      await conversation.populate('participants', 'username avatarUrl');
    }

    res.send(conversation);
  } catch (err) {
    console.error("FULL ERROR (getOrCreateConversation):", err);
    console.error("STACK:", err.stack);
    res.status(500).send({ error: err.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is in conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).send({ error: 'Conversation not found' });
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).send({ error: 'Access denied' });
    }

    console.log(`User ${req.user._id} is deleting conversation ${conversationId}`);

    // Delete all messages in the conversation
    const result = await Message.deleteMany({ conversationId });
    console.log(`Deleted ${result.deletedCount} messages for conversation ${conversationId}`);

    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversationId);

    res.send({ message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error("FULL ERROR (deleteConversation):", err);
    console.error("STACK:", err.stack);
    res.status(500).send({ error: err.message });
  }
};

