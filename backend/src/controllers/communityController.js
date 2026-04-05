import Community from '../models/Community.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { uploadToCloudinary } from '../utils/cloudinaryHelper.js';

export const createCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;
    const community = new Community({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id]
    });
    await community.save();

    // Add to user's communities
    const user = await User.findById(req.user._id);
    user.communities.push(community._id);
    await user.save();

    res.status(201).send(community);
  } catch (error) {
    console.error("FULL ERROR (createCommunity):", error);
    console.error("STACK:", error.stack);
    res.status(400).send({ error: error.message });
  }
};

export const getCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .populate('owner', 'username')
      .populate('members', 'username avatar');
    res.send(communities);
  } catch (error) {
    console.error("FULL ERROR (getCommunities):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('members', 'username avatar');
    if (!community) return res.status(404).send({ error: 'Community not found' });
    res.send(community);
  } catch (error) {
    console.error("FULL ERROR (getCommunityById):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).send({ error: 'Community not found' });

    if (!community.members.includes(req.user._id)) {
      community.members.push(req.user._id);
      await community.save();
    }

    const user = await User.findById(req.user._id);
    if (!user.communities.includes(community._id)) {
      user.communities.push(community._id);
      await user.save();
    }

    const populated = await Community.findById(community._id)
      .populate('owner', 'username avatar')
      .populate('members', 'username avatar');
    res.send(populated);
  } catch (error) {
    console.error("FULL ERROR (joinCommunity):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).send({ error: 'Community not found' });

    // Owner cannot leave
    if (community.owner.toString() === req.user._id.toString()) {
      return res.status(400).send({ error: 'Owner cannot leave. Transfer ownership first.' });
    }

    community.members = community.members.filter(m => m.toString() !== req.user._id.toString());
    await community.save();

    const user = await User.findById(req.user._id);
    user.communities = user.communities.filter(c => c.toString() !== community._id.toString());
    await user.save();

    res.send({ message: 'Left community' });
  } catch (error) {
    console.error("FULL ERROR (leaveCommunity):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const updateCommunityAvatar = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).send({ error: 'Community not found' });

    // Only owner can update avatar
    if (community.owner.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Only the community owner can update the avatar' });
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'communities');
      console.log("CLOUDINARY RESULT:", result);
      community.avatar = result.secure_url;
      await community.save();
      console.log("SAVED COMMUNITY:", community.avatar);
    }

    const populated = await Community.findById(community._id)
      .populate('owner', 'username avatar')
      .populate('members', 'username avatar');

    return res.send(populated);
  } catch (error) {
    console.error("FINAL ERROR (updateCommunityAvatar):", error);
    console.error("STACK:", error?.stack);

    return res.status(500).send({
      error: error?.message || "UNKNOWN_ERROR"
    });
  }
};

export const updateCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).send({ error: 'Community not found' });

    if (community.owner.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Only the community owner can edit this community' });
    }

    const { description } = req.body;
    if (description !== undefined) community.description = description;
    await community.save();

    const populated = await Community.findById(community._id)
      .populate('owner', 'username avatar')
      .populate('members', 'username avatar');
    res.send(populated);
  } catch (error) {
    console.error("FULL ERROR (updateCommunity):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).send({ error: 'Community not found' });

    if (community.owner.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Only the community owner can remove members' });
    }

    const memberId = req.params.memberId;
    if (memberId === community.owner.toString()) {
      return res.status(400).send({ error: 'Cannot remove the owner' });
    }

    community.members = community.members.filter(m => m.toString() !== memberId);
    await community.save();

    // Also remove from user's communities list
    const user = await User.findById(memberId);
    if (user) {
      user.communities = user.communities.filter(c => c.toString() !== community._id.toString());
      await user.save();
    }

    const populated = await Community.findById(community._id)
      .populate('owner', 'username avatar')
      .populate('members', 'username avatar');
    res.send(populated);
  } catch (error) {
    console.error("FULL ERROR (removeMember):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const getCommunityPosts = async (req, res) => {
  try {
    const posts = await Post.find({ community: req.params.id })
      .populate('author', 'username avatar')
      .populate('community', 'name')
      .sort({ createdAt: -1 });
    res.send(posts);
  } catch (error) {
    console.error("FULL ERROR (getCommunityPosts):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};
