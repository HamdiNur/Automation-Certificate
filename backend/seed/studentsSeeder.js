import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

import Student from '../models/Student.js';
import { connectDB } from '../config/db.js';
import { getFacultyByProgram, programDurations } from '../utils/programInfo.js';

dotenv.config();
connectDB();

const PROGRAM = "Bachelor of Science in Computer Applications";
const FACULTY = getFacultyByProgram(PROGRAM);
const YEAR_OF_ADMISSION = 2021;
const DURATION = programDurations[PROGRAM] || 4;
const YEAR_OF_GRADUATION = YEAR_OF_ADMISSION + DURATION;

// Somali-style surnames
const somaliSurnames = [
  "Nur", "Ali", "Mohamed", "Abdi", "Hassan", "Omar", "Farah", "Jama", "Yusuf", "Ahmed"
];

const seedStudents = async () => {
  try {
    await Student.deleteMany(); // Optional: clear existing students

    const students = [];

    for (let i = 1; i <= 100; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.helpers.arrayElement(somaliSurnames);
      const fullName = `${firstName} ${lastName}`;

      const email = `student${i}@just.edu.so`;
      const phone = faker.phone.number('061#######');
      const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const studentId = `CA21${String(i).padStart(4, '0')}`; // e.g. CA210001

      students.push({
        fullName,
        email,
        phone,
        rawPassword,
        hashedPassword,
        studentId,
        program: PROGRAM,
        faculty: FACULTY,
        yearOfAdmission: YEAR_OF_ADMISSION,
        duration: DURATION,
        yearOfGraduation: YEAR_OF_GRADUATION,
        profilePicture: '',
        clearanceStatus: 'pending',
        isCleared: false
      });
    }

    await Student.insertMany(students);
    console.log('✅ Seeded 100 Computer Application students!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedStudents();
