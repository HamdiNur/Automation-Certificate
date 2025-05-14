// seedCourseRecords.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import CourseRecord from '../models/course.js';
import Student from '../models/Student.js';
import { connectDB } from '../config/db.js';

dotenv.config();
connectDB();

const grades = ['A', 'B', 'C', 'D', 'F'];
const isPassed = (grade) => grade !== 'F';
const semesterCourses = {
  1: [
    ['CA114', 'Python Programming'],
    ['GN111', 'Arabic Language'],
    ['EE111', 'Mathematical Foundations for Engineering'],
    ['CA111', 'Fundamentals of IT'],
    ['GN112', 'English I'],
    ['CA112', 'Computer Application Skills']
  ],
  2: [
    ['CA126', 'OOP using Python'],
    ['EE121', 'Calculus'],
    ['GN121', 'Islamic Studies'],
    ['CA127', 'Computer Hardware'],
    ['CA123', 'Basics of Web Designing'],
    ['GN122', 'English II']
  ],
  3: [
    ['CA217', 'Database Systems'],
    ['CA213', 'Intro to Computer Networks'],
    ['CA216', 'JavaScript'],
    ['GN211', 'English III'],
    ['BA112', 'Financial Accounting I'],
    ['CA211', 'Discrete Mathematics']
  ],
  4: [
    ['CA322', 'Java Programming'],
    ['CA224', 'Multimedia Applications'],
    ['BA114', 'Principles of Management'],
    ['CA413', 'C# Programming I'],
    ['CA222', 'Digital Logic Design'],
    ['BA122', 'Business Statistics I']
  ],
  5: [
    ['CA317', 'Data Structures using Java'],
    ['CA318', 'C# Programming II'],
    ['CA319', 'Management Info Systems'],
    ['CA313', 'Advanced Computer Networks'],
    ['CA423', 'Oracle'],
    ['CA312', 'System Analysis & Design']
  ],
  6: [
    ['EE225', 'Intro to Telecommunication'],
    ['CA412', 'Advanced Java Programming'],
    ['CA325', 'Computer Organization'],
    ['GN311', 'Communication Skills'],
    ['CA314', 'Research Methodology'],
    ['CA3111', 'Web Dev using React']
  ],
  7: [
    ['BA226', 'Entrepreneurship'],
    ['CA424', 'Mobile Programming'],
    ['CA422', 'Web Dev with PHP & MySQL'],
    ['CA417', 'Advanced Web Dev with Node.js'],
    ['CA416', 'Principles of Data Science'],
    ['CA324', 'Information Security']
  ],
  8: [
    ['CA510', 'E-Commerce'],
    ['CA511', 'Operating Systems'],
    ['CA512', 'IT Ethics & Cyber Law']
  ]
};

const seedCourseRecords = async () => {
  try {
    await CourseRecord.deleteMany(); // Optional: clear existing

    const students = await Student.find({});
    const allRecords = [];

   for (let i = 0; i < students.length; i++) {
  const student = students[i];
  const shouldPassAll = i < Math.floor(students.length * 0.5); // 50% pass all

  for (let semester = 1; semester <= 8; semester++) {
    for (const [courseCode, courseName] of semesterCourses[semester]) {
      let grade;

      if (shouldPassAll) {
        // Give only passing grades: A, B, C, D
        grade = faker.helpers.arrayElement(['A', 'B', 'C', 'D']);
      } else {
        // Include a chance of F
        grade = faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'F']);
      }

      const passed = isPassed(grade); // ✅ Only fails if grade === 'F'

      allRecords.push({
        studentId: student._id,
        semester,
        courseCode,
        courseName,
        grade,
        passed
      });
    }
  }
}

    await CourseRecord.insertMany(allRecords);
    console.log(`✅ Seeded ${allRecords.length} course records for ${students.length} students.`);
    process.exit();
  } catch (err) {
    console.error('❌ Failed to seed course records:', err.message);
    process.exit(1);
  }
};

seedCourseRecords();
