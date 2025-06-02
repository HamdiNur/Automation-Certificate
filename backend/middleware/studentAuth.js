// middleware/studentAuth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Student from '../models/Student.js';

dotenv.config();

const studentAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const student = await Student.findById(decoded.id).select('-password');
    if (!student) {
      return res.status(401).json({ error: 'Student not found in DB' });
    }

    req.user = student; // 🚨 sets req.user to the student
    next();
  } catch (err) {
    res.status(401).json({ error: `Not authorized, token failed: ${err.message}` });
  }
};

export default studentAuth;
