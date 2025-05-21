import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Lab from '../models/lab.js';
import bcrypt from 'bcryptjs';
import { generateStudentUserId } from '../utils/idGenerator.js';
import { getFacultyByProgram, programDurations } from '../utils/programInfo.js';

// 🔹 Register Student
export const registerStudent = async (req, res) => {
  try {
    const { fullName, email, program, yearOfAdmission, phone } = req.body;

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
      hashedPassword,
      clearanceStatus: "Pending",
      isCleared: false
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
        phone: newStudent.phone,
        profilePicture: newStudent.profilePicture,
        clearanceStatus: newStudent.clearanceStatus
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Login Student
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

// 🔹 Get All Students with Populated Group
import Library from "../models/library.js"; // add this at the top

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("groupId", "groupNumber");

    // 🔁 For each student, fetch clearance status from Library model
    const results = await Promise.all(
      students.map(async (student) => {
        const libraryRecord = await Library.findOne({ members: student._id });
        const clearanceStatus = libraryRecord?.status || "Pending";

        return {
          ...student.toObject(),
          clearanceStatus,
        };
      })
    );

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students", error: err.message });
  }
};
// controllers/studentController.js
export const getStudentsWithLabStatus = async (req, res) => {
  try {
    const students = await Student.find().populate("groupId", "groupNumber");
    const labs = await Lab.find().lean();

    const result = students.map(student => {
      let labStatus = "Pending";

      const lab = labs.find(l => {
        const sameGroup =
          l.groupId?.toString() === student.groupId?.toString() ||
          l.groupId?.toString() === student.groupId?._id?.toString();

        const isMember = l.members?.some(m => m.toString() === student._id.toString());
        return sameGroup && isMember;
      });

      if (lab) {
        labStatus = lab.status;
      }

      return {
        _id: student._id,
        fullName: student.fullName,
        studentId: student.studentId,
        program: student.program,
        groupNumber: student.groupId?.groupNumber || "—",
        labStatus
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch lab status",
      error: error.message
    });
  }
};
