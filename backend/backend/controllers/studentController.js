import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import bcrypt from 'bcryptjs';
import { generateStudentUserId } from '../utils/idGenerator.js';
import { getFacultyByProgram, programDurations } from '../utils/programInfo.js';

export const registerStudent = async (req, res) => {
  try {
    const { fullName, email, program, yearOfAdmission ,phone} = req.body;

    const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const studentId = await generateStudentUserId(program, yearOfAdmission);
    const faculty = getFacultyByProgram(program);
    const duration = programDurations[program] || 4;
    const yearOfGraduation = yearOfAdmission + duration;

    const newStudent = await Student.create({
      fullName,
      email,
      studentId,
      program,
      faculty,
      yearOfAdmission,
      duration,
      yearOfGraduation,
      rawPassword,
      phone,
      hashedPassword
     
    });

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        fullName: newStudent.fullName,
        email: newStudent.email,
        studentId: newStudent.studentId,
        program: newStudent.program,
        faculty: newStudent.faculty,
        yearOfAdmission: newStudent.yearOfAdmission,
        yearOfGraduation: newStudent.yearOfGraduation,
        password: newStudent.rawPassword,
        phone: newStudent.phone,
        profilePicture: newStudent.profilePicture,
        clearanceStatus: newStudent.clearanceStatus,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginStudent = async (req, res) => {
  const { studentId, password } = req.body;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const isMatch = await bcrypt.compare(password, student.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // ✅ Add check to ensure secret is available
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is undefined. Please check your .env setup.");
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    const token = jwt.sign(
      { id: student._id, studentId: student.studentId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      student: {
        id: student._id,
        fullName: student.fullName,
        studentId: student.studentId,
        program: student.program,
        faculty: student.faculty,
        email: student.email,
        profilePicture: student.profilePicture,
        clearanceStatus: student.clearanceStatus
      }
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
};
