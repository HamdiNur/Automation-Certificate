// 📁 backend/scripts/generateAllExaminations.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Student from '../models/Student.js';
import CourseRecord from '../models/course.js';
import Clearance from '../models/Clearance.js';
import Examination from '../models/examination.js';

dotenv.config();
await connectDB();

const seedExaminations = async () => {
  try {
    const students = await Student.find({});
    const inserted = [];

    for (const student of students) {
      const existing = await Examination.findOne({ studentId: student._id });
      if (existing) continue; // Skip if already exists

      const hasCourses = await CourseRecord.exists({ studentId: student._id });
      if (!hasCourses) continue; // Only create if course records exist

      const failedCourse = await CourseRecord.exists({
        studentId: student._id,
        passed: false
      });

      const hasPassedAllCourses = !failedCourse;

      const clearance = await Clearance.findOne({ studentId: student._id });

      const financeApproved =
        clearance && clearance.finance?.status === 'Approved';

      const canGraduate = hasPassedAllCourses && financeApproved;

      const exam = new Examination({
        studentId: student._id,
        hasPassedAllCourses,
        canGraduate,
        clearanceStatus: 'Pending'
      });

      await exam.save();
      inserted.push(student._id);
    }

    console.log(`✅ Created examination records for ${inserted.length} students.`);
    process.exit();
  } catch (err) {
    console.error('❌ Error generating examination records:', err.message);
    process.exit(1);
  }
};

seedExaminations();
