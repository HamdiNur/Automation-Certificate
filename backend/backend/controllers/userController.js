import User from "../models/User.js";
import Student from "../models/Student.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateStudentUserId, generateStaffUserId } from '../utils/idGenerator.js';
import { getFacultyByProgram, programDurations
} from '../utils/programInfo.js';



export const registerUser = async (req, res) => {
  try {
    let { fullName, email, password, role, program, yearOfAdmission } = req.body;

    //  Auto-generate a 6-digit password if not provided
    if (!password) {
      password = Math.floor(100000 + Math.random() * 900000).toString();
      // console.log(`Generated password for ${email}: ${password}`);
    }

    let userId;

    //  Generate userId for students
    if (role === 'student') {
      userId = await generateStudentUserId(program, yearOfAdmission);
    } else {
      userId = req.body.userId;
    
      //  Auto-generate if not manually given
      if (!userId) {
        const yearOfEmployment = req.body.yearOfEmployment || new Date().getFullYear();
        userId = await generateStaffUserId(role, yearOfEmployment);
      }
    }

    //  Prevent duplicate user IDs
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ error: 'User ID already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 👤 Create User record
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      rawPassword: password, //  Save raw password for future lookup
      role: role || 'student',
      userId
    });

    // If student, create matching Student profile
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

    //  Respond with user info and raw password
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        userId: user.userId,
        role: user.role,
        password: password //  show raw password one time
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// LOGIN USER
export const loginUser = async (req, res) => {
  const { userId, password } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        userId: user.userId,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
