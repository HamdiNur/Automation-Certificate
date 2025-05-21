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

// Somali-style first and surnames
const somaliMaleFirstNames = ["Mohamed", "Abdirahman", "Hassan", "Farah", "Omar", "Yusuf", "Abdi", "Jama"];
const somaliFemaleFirstNames = ["Amina", "Fadumo", "Ifrah", "Nasteho", "Zahra", "Hodan", "Maryan", "Sagal"];
const somaliSurnames = ["Nur", "Ali", "Mohamed", "Abdi", "Hassan", "Omar", "Farah", "Jama", "Yusuf", "Ahmed"];

const seedStudents = async () => {
  try {
    await Student.deleteMany(); // Clear existing students

    const students = [];

    for (let i = 1; i <= 100; i++) {
      const gender = faker.helpers.arrayElement(['male', 'female']);

      const firstName = gender === 'male'
        ? faker.helpers.arrayElement(somaliMaleFirstNames)
        : faker.helpers.arrayElement(somaliFemaleFirstNames);

      const lastName = faker.helpers.arrayElement(somaliSurnames);
      const fullName = `${firstName} ${lastName}`;

      const motherFirstName = faker.helpers.arrayElement(somaliFemaleFirstNames);
      const motherSurname = faker.helpers.arrayElement(somaliSurnames);
      const motherName = `${motherFirstName} ${motherSurname}`;

      const email = `student${i}@just.edu.so`;
      const phone = faker.phone.number('061#######');
      const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const studentId = `CA21${String(i).padStart(4, '0')}`; // e.g. CA210001

      students.push({
        // 🎓 Identity
        studentId,
        fullName,
        gender,
        motherName,

        // 📚 Academic Info
        program: PROGRAM,
        faculty: FACULTY,
        yearOfAdmission: YEAR_OF_ADMISSION,
        duration: DURATION,
        yearOfGraduation: YEAR_OF_GRADUATION,

        // 📞 Contact
        email,
        phone,

        // 🔐 Auth Info
        rawPassword,
        hashedPassword,

        // 📷 Profile & Clearance
        profilePicture: '',
        clearanceStatus: 'pending',
        isCleared: false
      });
    }

    await Student.insertMany(students);
    console.log('✅ Seeded 100 Somali-style Computer Application students!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedStudents();
