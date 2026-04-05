import jwt from 'jsonwebtoken';
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing in middleware");
}

export const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).send({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).send({ error: 'Invalid token' });
  }
};
