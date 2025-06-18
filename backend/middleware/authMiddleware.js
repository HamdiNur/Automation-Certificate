import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ error: 'User not found in DB' });
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.warn("⚠️ Token expired!");
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    console.error('❌ Auth Middleware Error:', err.message);
    return res.status(401).json({ error: `Not authorized: ${err.message}` });
  }
};

export default auth;
