import jwt from 'jsonwebtoken';
import User from '../models/User.js';

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing in middleware");
}

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).send({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).send({ error: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).send({ error: 'Account has been banned' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Invalid token' });
  }
};
