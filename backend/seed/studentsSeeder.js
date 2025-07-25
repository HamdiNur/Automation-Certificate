import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

import Student from '../models/Student.js';
import { connectDB } from '../config/db.js';
import { getFacultyByProgram, programDurations } from '../utils/programInfo.js';
import { generateStudentUserId } from '../utils/idGenerator.js';

import {
  somaliMaleFirstNames,
  somaliFemaleFirstNames,
  somaliMiddleNames,
  somaliSurnames
} from '../utils/data/somaliNames.js';

dotenv.config();
await connectDB();

// 📌 Constants
const TOTAL_STUDENTS = 240;
const FULLTIME_COUNT = 168;
const PARTTIME_COUNT = 72;

const MALE_COUNT = 132;
const FEMALE_COUNT = 108;

const PROGRAM = "Bachelor of Science in Computer Applications";
const FACULTY = getFacultyByProgram(PROGRAM);
const DURATION = programDurations[PROGRAM] || 4;
const ADMISSION_YEAR = 2021;
const GRADUATION_YEAR = ADMISSION_YEAR + DURATION;

// 🔀 Shuffle genders randomly
const generateGenderList = () => {
  const genders = Array(MALE_COUNT).fill('Male').concat(Array(FEMALE_COUNT).fill('Female'));
  return faker.helpers.shuffle(genders);
};


const usedHemisIds = new Set();

const generateUniqueHemisId = () => {
  let id;
  do {
    id = Math.floor(100000 + Math.random() * 900000); // generates 6-digit number
  } while (usedHemisIds.has(id)); // Ensure no duplicate hemisId
  usedHemisIds.add(id);
  return id;
};

const seedStudents = async () => {
  try {
    await Student.deleteMany();
    const students = [];
    const genderList = generateGenderList(); // 🧠 New line

    const generateStudent = async (i, mode, indexInGroup) => {
      const gender = genderList[i - 1]; // 👈 Use shuffled gender

      const firstName = gender === 'Male'
        ? faker.helpers.arrayElement(somaliMaleFirstNames)
        : faker.helpers.arrayElement(somaliFemaleFirstNames);
      const middleName = faker.helpers.arrayElement(somaliMiddleNames);
      const lastName = faker.helpers.arrayElement(somaliSurnames);
      const fullName = `${firstName} ${middleName} ${lastName}`;
      const motherName = `${faker.helpers.arrayElement(somaliFemaleFirstNames)} ${faker.helpers.arrayElement(somaliSurnames)}`;

      const email = `${firstName.toLowerCase()}${i}@just.edu.so`;
      const phone = `+25261${faker.string.numeric(7)}`;
      const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const studentId = await generateStudentUserId(PROGRAM, ADMISSION_YEAR, i - 1); // C1210001...


      // Generate the hemisId
      const hemisId = generateUniqueHemisId(); // Generate uniqu

      let classNumber = '';
      if (mode === 'Fulltime') {
        classNumber = 1 + Math.floor(indexInGroup / 50); // CA211, CA212...
      } else {
        classNumber = 4 + Math.floor(indexInGroup / 30); // CA214, CA215...
      }

      const studentClass = `CA21${classNumber}`;

      return {
        studentId,
       hemisId, // ✅ Add hemisId here
        fullName,
        gender,
        motherName,
        program: PROGRAM,
        faculty: FACULTY,
        yearOfAdmission: ADMISSION_YEAR,
        duration: DURATION,
        yearOfGraduation: GRADUATION_YEAR,
        email,
        phone,
        rawPassword,
        hashedPassword,
        mode,
        status: 'Active',
        profilePicture: '',
        clearanceStatus: 'Pending',
        isCleared: false,
        studentClass
      };
    };

    // Generate full-time students
    for (let i = 1; i <= FULLTIME_COUNT; i++) {
      const student = await generateStudent(i, 'Fulltime', i - 1);
      students.push(student);
    }

    // Generate part-time students
    for (let i = 1; i <= PARTTIME_COUNT; i++) {
      const index = FULLTIME_COUNT + i - 1;
      const student = await generateStudent(index + 1, 'Parttime', index);
      students.push(student);
    }

    await Student.insertMany(students);
    console.log('✅ Seeded 214 students (168 full-time, 72 part-time) with mixed genders across classes');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding students:', error.message);
    process.exit(1);
  }
};

seedStudents();
