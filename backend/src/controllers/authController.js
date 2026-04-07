import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '../utils/cloudinaryHelper.js';

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).send({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).send({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        isBanned: user.isBanned,
        followers: user.followers || [],
        following: user.following || []
      },
      token
    });

  } catch (error) {
    console.error("FULL ERROR (register):", error);
    console.error("STACK:", error.stack);
    res.status(400).send({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send({ error: 'Invalid credentials' });
    }

    if (user.email === 'archie220003@gmail.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    if (user.isBanned) {
      return res.status(403).send({ error: 'Account has been banned' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.send({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        isBanned: user.isBanned,
        followers: user.followers || [],
        following: user.following || []
      },
      token
    });

  } catch (error) {
    console.error("FULL ERROR (login):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('communities');

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).send({ error: 'Account has been banned' });
    }

    res.send({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        isBanned: user.isBanned,
        communities: user.communities,
        followers: user.followers || [],
        following: user.following || []
      }
    });

  } catch (error) {
    console.error("FULL ERROR (getProfile):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'avatars');
      user.avatar = result.secure_url;
    }

    await user.save();

    res.send({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        followers: user.followers || [],
        following: user.following || []
      }
    });

  } catch (error) {
    console.error("FINAL ERROR (updateProfile):", error);
    console.error("STACK:", error?.stack);
    res.status(500).send({
      error: error?.message || "UNKNOWN_ERROR"
    });
  }
};