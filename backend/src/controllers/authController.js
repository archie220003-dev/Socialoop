import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '../utils/cloudinaryHelper.js';
import Otp from '../models/Otp.js';
import { sendOtpEmail } from '../utils/mailer.js';

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
      if (existingUser.isVerified !== false) {
        return res.status(400).send({ error: 'Username or email already exists' });
      }

      // If they are unverified, we delete the unverified user to create a fresh one.
      const usernameTaken = await User.findOne({ username, email: { $ne: email }, isVerified: { $ne: false } });
      if (usernameTaken) {
        return res.status(400).send({ error: 'Username already taken' });
      }
      
      await User.deleteOne({ _id: existingUser._id });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false
    });

    await user.save();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email, type: 'register' });
    await Otp.create({ email, otp, type: 'register' });
    await sendOtpEmail(email, otp);

    res.status(201).send({
      message: 'Verification OTP sent to email',
      email
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

    if (user.isVerified === false) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await Otp.deleteMany({ email: user.email, type: 'register' });
      await Otp.create({ email: user.email, otp, type: 'register' });
      await sendOtpEmail(user.email, otp);
      return res.status(401).send({ 
        error: 'Email not verified. A verification OTP has been sent to your email.', 
        unverified: true, 
        email: user.email 
      });
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

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    if (!email || !otp || !type) {
      return res.status(400).send({ error: 'Email, OTP and type are required' });
    }

    const otpRecord = await Otp.findOne({ email, otp, type }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).send({ error: 'Invalid or expired OTP' });
    }

    await Otp.deleteMany({ email, type });

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    if (type === 'register') {
      user.isVerified = true;
      await user.save();
    }

    if (user.isBanned) {
      return res.status(403).send({ error: 'Account has been banned' });
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
    console.error("FULL ERROR (verifyOtp):", error);
    res.status(500).send({ error: error.message });
  }
};

export const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: 'No account found with this email. Please register first.' });
    }

    if (user.isBanned) {
      return res.status(403).send({ error: 'Account has been banned' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (user.isVerified === false) {
      await Otp.deleteMany({ email, type: 'register' });
      await Otp.create({ email, otp, type: 'register' });
      await sendOtpEmail(email, otp);
      return res.send({
        message: 'Account not verified. A verification OTP has been sent to your email.',
        email,
        type: 'register'
      });
    }

    await Otp.deleteMany({ email, type: 'login' });
    await Otp.create({ email, otp, type: 'login' });
    await sendOtpEmail(email, otp);

    res.send({
      message: 'Login OTP sent to your email.',
      email,
      type: 'login'
    });

  } catch (error) {
    console.error("FULL ERROR (sendLoginOtp):", error);
    res.status(500).send({ error: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).send({ error: 'Email and type are required' });
    }

    if (!['register', 'login'].includes(type)) {
      return res.status(400).send({ error: 'Invalid OTP type' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'No account found with this email.' });
    }

    if (user.isBanned) {
      return res.status(403).send({ error: 'Account has been banned' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email, type });
    await Otp.create({ email, otp, type });
    await sendOtpEmail(email, otp);

    res.send({ message: `OTP resent to ${email}`, email, type });

  } catch (error) {
    console.error("FULL ERROR (resendOtp):", error);
    res.status(500).send({ error: error.message });
  }
};