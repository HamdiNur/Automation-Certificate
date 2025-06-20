import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import Student from '../models/Student.js';
import Group from '../models/group.js';
import CourseRecord from '../models/course.js';
import Clearance from '../models/Clearance.js';
import Examination from '../models/examination.js';
import Finance from '../models/finance.js';

import { generateStudentUserId } from '../utils/idGenerator.js';
import { getFacultyByProgram, programDurations } from '../utils/programInfo.js';

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
      gender,
      mode,
      status,
      
    } = req.body;

    // 🔐 Generate password & hash
    const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 🆔 Generate student ID
    const studentId = await generateStudentUserId(program, yearOfAdmission);

    // 🏛️ Get academic info
    const faculty = getFacultyByProgram(program);
    const duration = programDurations[program] || 4;
    const yearOfGraduation = yearOfAdmission + duration;

    // 🏫 Generate student class label (e.g., CA211)
    const index = await Student.countDocuments({ program, yearOfAdmission });
    const studentClass = generateStudentClass(program, yearOfAdmission, index);

    // 📦 Create student
    const newStudent = await Student.create({
      fullName,
      email,
      studentId,
      program,
      faculty,
      yearOfAdmission,
      duration,
      yearOfGraduation,
      studentClass,
      rawPassword,
      hashedPassword,
      phone,
      motherName,
      gender,
      mode,
      status,
 
    });

    // ✅ Respond
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
        studentClass: newStudent.studentClass, // ✅ Included
        email: newStudent.email,
        phone: newStudent.phone,
        password: newStudent.rawPassword, // 🔐 Returned for demo; secure in production
        clearanceStatus: newStudent.clearanceStatus,
        profilePicture: newStudent.profilePicture,
        mode: newStudent.mode,
        status: newStudent.status,
      }
    });
  } catch (error) {
    console.error('Register Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};



// ✅ LOGIN STUDENT
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
  studentClass: student.studentClass, // ✅ Add this line
  email: student.email,
  phone: student.phone,
  clearanceStatus: student.clearanceStatus,
  profilePicture: student.profilePicture,
  mode: student.mode,
  status: student.status,
}

});

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const query = {};

    // ✅ Filter: only students who properly requested name correction
    if (req.query.nameCorrectionRequested === "true") {
      query.nameCorrectionRequested = true;
      query.nameCorrectionEligible = true;
    }

    const students = await Student.find(query);
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students", error: err.message });
  }
};

// ✅ Add getSudentById
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
  const { studentId, requestedName } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    await Student.findByIdAndUpdate(studentId, {
      correctionUploadUrl: file.path,
      requestedName,
      nameVerified: false,
      nameCorrectionEligible: true // ✅ Add this line
    });
    await Examination.findOneAndUpdate(
  { studentId },
  {
    nameCorrectionDoc: file.path,
    "requiredDocs.passportUploaded": true
  }
);

    res.status(200).json({
      message: 'Correction document uploaded successfully',
      path: file.path
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload correction doc', error: err.message });
  }
};


//✅ Approve name correction
export const approveNameCorrection = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (!student.correctionUploadUrl) {
      return res.status(400).json({ message: 'No document uploaded' });
    }

    await Student.findByIdAndUpdate(studentId, {
      nameVerified: true,
      sentToAdmission: false // Not yet sent to admissions
    });

    res.status(200).json({ message: '✅ Name correction approved and verified' });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
};

// ❌ Reject name correction
export const rejectNameCorrection = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    await Student.findByIdAndUpdate(studentId, {
      nameCorrectionRequested: false,
      requestedName: '',
      correctionUploadUrl: '',
      nameVerified: false,
      sentToAdmission: false
    });

    res.status(200).json({ message: '❌ Name correction request rejected and cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
};

// ✅ Mark as sent to admissions
export const forwardToAdmission = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId);
    if (!student || !student.nameVerified) {
      return res.status(400).json({ message: 'Student not verified for name change' });
    }

    await Student.findByIdAndUpdate(studentId, {
      sentToAdmission: true
    });

    res.status(200).json({ message: '📨 Name correction forwarded to Admission Office' });
  } catch (err) {
    res.status(500).json({ message: 'Forwarding failed', error: err.message });
  }
};
