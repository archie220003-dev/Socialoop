import User from '../models/User.js';
import cloudinary from '../../cloudinary.js';

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password').populate('communities');

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    res.send({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isBanned: user.isBanned,
        communities: user.communities
      }
    });
  } catch (error) {
    console.error("FULL ERROR (getUserProfile):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).send({ error: "You cannot follow yourself." });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) return res.status(404).send({ error: 'User not found' });

    const isFollowing = currentUser.following.some(id => id.toString() === targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.addToSet(targetUserId);
      targetUser.followers.addToSet(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.send({ following: !isFollowing });
  } catch (error) {
    console.error("FULL ERROR (toggleFollow):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};
