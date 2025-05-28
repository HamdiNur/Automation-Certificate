import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import CourseRecord from '../models/course.js';
import Student from '../models/Student.js';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const isPassed = (grade) => grade !== 'F';

const semesterCourses = {
  1: [['CA114', 'Python Programming'], ['GN111', 'Arabic Language'], ['EE111', 'Math Foundations'], ['CA111', 'Fundamentals of IT'], ['GN112', 'English I'], ['CA112', 'Computer Skills']],
  2: [['CA126', 'OOP using Python'], ['EE121', 'Calculus'], ['GN121', 'Islamic Studies'], ['CA127', 'Computer Hardware'], ['CA123', 'Web Designing'], ['GN122', 'English II']],
  3: [['CA217', 'Database Systems'], ['CA213', 'Intro to Networks'], ['CA216', 'JavaScript'], ['GN211', 'English III'], ['BA112', 'Accounting I'], ['CA211', 'Discrete Math']],
  4: [['CA322', 'Java'], ['CA224', 'Multimedia'], ['BA114', 'Management'], ['CA413', 'C# I'], ['CA222', 'Digital Logic'], ['BA122', 'Statistics I']],
  5: [['CA317', 'Data Structures'], ['CA318', 'C# II'], ['CA319', 'MIS'], ['CA313', 'Adv Networks'], ['CA423', 'Oracle'], ['CA312', 'System Design']],
  6: [['EE225', 'Telecommunication'], ['CA412', 'Java II'], ['CA325', 'Computer Org'], ['GN311', 'Communication Skills'], ['CA314', 'Research'], ['CA3111', 'React']],
  7: [['BA226', 'Entrepreneurship'], ['CA424', 'Mobile Dev'], ['CA422', 'PHP & MySQL'], ['CA417', 'Node.js'], ['CA416', 'Data Science'], ['CA324', 'Info Security']],
  8: [['CA510', 'E-Commerce'], ['CA511', 'OS'], ['CA512', 'Cyber Law']]
};

const seedCourseRecords = async () => {
  try {
    await CourseRecord.deleteMany();
    const students = await Student.find({});
    const allRecords = [];

    const passRate = 0.6;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const shouldPassAll = i < Math.floor(students.length * passRate);

      const coursePool = []; // all course info for the student

      for (let semester = 1; semester <= 8; semester++) {
        for (const [courseCode, courseName] of semesterCourses[semester]) {
          coursePool.push({ semester, courseCode, courseName });
        }
      }

      // Randomly decide how many courses to fail (if in fail group)
      const failCount = shouldPassAll ? 0 : faker.number.int({ min: 1, max: 5 });

      // Randomly pick `failCount` indexes to fail
      const failedIndexes = new Set();
      while (failedIndexes.size < failCount) {
        failedIndexes.add(faker.number.int({ min: 0, max: coursePool.length - 1 }));
      }

      for (let j = 0; j < coursePool.length; j++) {
        const { semester, courseCode, courseName } = coursePool[j];
        let grade;

        if (failedIndexes.has(j)) {
          grade = 'F';
        } else {
          grade = faker.helpers.arrayElement(['A', 'B', 'C', 'D']);
        }

        allRecords.push({
          studentId: student._id,
          semester,
          courseCode,
          courseName,
          grade,
          passed: isPassed(grade)
        });
      }
    }

    await CourseRecord.insertMany(allRecords);
    console.log(`✅ Seeded ${allRecords.length} course records for ${students.length} students (with max 5 failed if any).`);
    process.exit();
  } catch (err) {
    console.error('❌ Failed to seed course records:', err.message);
    process.exit(1);
  }
};

seedCourseRecords();
