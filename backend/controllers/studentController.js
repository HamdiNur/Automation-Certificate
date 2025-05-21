import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Lab from '../models/lab.js';
import bcrypt from 'bcryptjs';
import Group from '../models/group.js'; // ✅ Add this
import CourseRecord from '../models/course.js';
import Clearance from '../models/Clearance.js';

import Finance from '../models/finance.js';

import { generateStudentUserId } from '../utils/idGenerator.js';
import { getFacultyByProgram, programDurations } from '../utils/programInfo.js';

<<<<<<< HEAD
// 🔹 Register Student
export const registerStudent = async (req, res) => {
  try {
    const { fullName, email, program, yearOfAdmission, phone } = req.body;
=======
// ✅ REGISTER STUDENT
export const registerStudent = async (req, res) => {
  try {
    const {
      fullName,
      email,
      program,
      yearOfAdmission,
      phone,
      motherName,
      gender
    } = req.body;
>>>>>>> master

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
      hashedPassword,
      phone,
<<<<<<< HEAD
      hashedPassword,
      clearanceStatus: "Pending",
      isCleared: false
=======
      motherName,
      gender
>>>>>>> master
    });

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        studentId: newStudent.studentId,
        fullName: newStudent.fullName,
        gender: newStudent.gender,
        motherName: newStudent.motherName,

        program: newStudent.program,
        faculty: newStudent.faculty,
        yearOfAdmission: newStudent.yearOfAdmission,
        yearOfGraduation: newStudent.yearOfGraduation,
<<<<<<< HEAD
        phone: newStudent.phone,
        profilePicture: newStudent.profilePicture,
        clearanceStatus: newStudent.clearanceStatus
=======

        email: newStudent.email,
        phone: newStudent.phone,
        password: newStudent.rawPassword, // only return in registration

        clearanceStatus: newStudent.clearanceStatus,
        profilePicture: newStudent.profilePicture
>>>>>>> master
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

<<<<<<< HEAD
// 🔹 Login Student
=======
// ✅ LOGIN STUDENT
>>>>>>> master
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
        studentId: student.studentId,
        fullName: student.fullName,
        gender: student.gender,
        motherName: student.motherName,

        program: student.program,
        faculty: student.faculty,
        yearOfAdmission: student.yearOfAdmission,
        yearOfGraduation: student.yearOfGraduation,

        email: student.email,
        phone: student.phone,

        clearanceStatus: student.clearanceStatus,
        profilePicture: student.profilePicture
      }
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
};

<<<<<<< HEAD
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
=======
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students', error: err.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch student', error: err.message });
  }
};



export const getEligibleForNameCorrection = async (req, res) => {
  try {
    const eligibleStudents = [];

    const clearedGroups = await Group.find({
      "clearanceProgress.faculty.status": "Approved",
      "clearanceProgress.library.status": "Approved",
      "clearanceProgress.lab.status": "Approved"
    }).populate('members');

    for (const group of clearedGroups) {
      for (const student of group.members) {
        const courses = await CourseRecord.find({ studentId: student._id });
        const failed = courses.some(c => c.passed === false);

        const charges = await Finance.find({ studentId: student._id, type: "Charge" });
        const pendingCharges = charges.some(f => f.status === "Pending");

        if (!failed && !pendingCharges) {
          eligibleStudents.push({
            studentId: student.studentId,
            fullName: student.fullName,
            email: student.email,
            groupNumber: group.groupNumber
          });

          // Optionally mark in DB
          await Student.updateOne({ _id: student._id }, { $set: { nameCorrectionEligible: true } });
        }
      }
    }

    res.status(200).json({ count: eligibleStudents.length, eligibleStudents });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch eligible students', error: err.message });
  }
};

// export const getEligibleForNameCorrection = async (req, res) => {
//   try {
//     const eligibleStudents = await Student.find({ nameCorrectionEligible: true })
//       .select('studentId fullName email groupId')
//       .populate('groupId', 'groupNumber')
//       .lean();

//     const formatted = eligibleStudents.map(st => ({
//       studentId: st.studentId,
//       fullName: st.fullName,
//       email: st.email,
//       groupNumber: st.groupId?.groupNumber || 'N/A'
//     }));

//     res.status(200).json({
//       count: formatted.length,
//       eligibleStudents: formatted
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch eligible students', error: err.message });
//   }
// };


// ✅ Toggle Name Correction Request (set by student)
export const markNameCorrectionRequest = async (req, res) => {
  const { studentId, requested } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // ✅ Check if Faculty, Library, Lab are approved
    const clearance = await Clearance.findOne({ studentId });
    if (
      !clearance ||
      clearance.faculty.status !== 'Approved' ||
      clearance.library.status !== 'Approved' ||
      clearance.lab.status !== 'Approved'
    ) {
      return res.status(403).json({ message: 'Clearance not fully approved' });
    }

    // ✅ Check graduation fee status
    const gradFee = await Finance.findOne({
      studentId,
      semester: 8,
      type: 'Payment',
      description: /Graduation Fee/i,
      status: 'Approved'
    });

    if (!gradFee) {
      return res.status(403).json({ message: 'Graduation fee not approved' });
    }

    // ✅ Check if all courses are passed
    const hasFailed = await CourseRecord.exists({ studentId, passed: false });
    if (hasFailed) {
      return res.status(403).json({ message: 'Student has failed courses' });
    }

    // ✅ If all good, update student record
    await Student.findByIdAndUpdate(studentId, {
      nameCorrectionRequested: requested,
      nameCorrectionEligible: true
    });

    res.status(200).json({ message: '✅ Request accepted. You can upload your document.' });

  } catch (err) {
    res.status(500).json({ message: 'Failed to update request', error: err.message });
  }
};

// Upload file (passport/school cert) for name correction
export const uploadCorrectionFile = async (req, res) => {
  const { studentId } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    await Student.findByIdAndUpdate(studentId, {
      correctionUploadUrl: file.path,
      nameVerified: false
    });

    res.status(200).json({ message: 'Correction document uploaded successfully', path: file.path });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload correction doc', error: err.message });
>>>>>>> master
  }
};
