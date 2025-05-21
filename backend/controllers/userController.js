import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { generateStudentUserId, generateStaffUserId } from '../utils/idGenerator.js';
import { getFacultyByProgram, programDurations } from '../utils/programInfo.js';
import dotenv from 'dotenv';

dotenv.config();

// 📌 REGISTER USER
export const registerUser = async (req, res) => {
  try {
    let { fullName, email, password, role, program, yearOfAdmission, department, username } = req.body;

    if (!password) {
      password = Math.floor(100000 + Math.random() * 900000).toString();
    }

    let userId;

    if (role === 'student') {
      userId = await generateStudentUserId(program, yearOfAdmission);
    } else {
      userId = req.body.userId;
      if (!userId) {
        const yearOfEmployment = req.body.yearOfEmployment || new Date().getFullYear();
        userId = await generateStaffUserId(role, yearOfEmployment);
      }
    }

    const existingUser = await User.findOne({ $or: [{ userId }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User ID or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      rawPassword: password,
      role: role || 'student',
      userId,
      username: username?.toLowerCase() || null,
      department
    });

    if (role === 'student') {
      const faculty = getFacultyByProgram(program);
      const duration = programDurations[program] || 4;

      await Student.create({
        userId: user._id,
        studentId: user.userId,
        program,
        faculty,
        yearOfAdmission,
        duration
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        userId: user.userId,
        username: user.username,
        role: user.role,
        password // raw
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 LOGIN WITH USERNAME ONLY
// 📌 LOGIN WITH USERNAME ONLY
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username?.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // ✅ Correctly use user._id here
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: 60 * 60 * 24 * 7, // 🕒 Token valid for 7 days
      }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        userId: user.userId,
        username: user.username,
        department: user.department,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 📌 GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -rawPassword');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Profile fetched successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
