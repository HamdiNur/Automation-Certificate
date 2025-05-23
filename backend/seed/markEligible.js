import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import CourseRecord from '../models/course.js';
import Finance from '../models/finance.js';
import Clearance from '../models/Clearance.js';
import Examination from '../models/examination.js';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const markEligibleForExamination = async () => {
  try {
    const clearedGroups = await Group.find({
      "clearanceProgress.faculty.status": "Approved",
      "clearanceProgress.library.status": "Approved",
      "clearanceProgress.lab.status": "Approved"
    }).populate("members");

    let created = 0, skipped = 0;

    for (const group of clearedGroups) {
      for (const student of group.members) {
        const studentId = student._id;

        // Avoid duplicates
        const alreadyExists = await Examination.exists({ studentId });
        if (alreadyExists) continue;

        // ✅ Check course pass
        const hasFailed = await CourseRecord.exists({
          studentId,
          passed: false
        });

        // ✅ Check if graduation fee paid
        const financeApproved = await Finance.exists({
          studentId,
          type: "Payment",
          description: /Graduation Fee/i,
          status: "Approved"
        });

        // ✅ Create examination record regardless of pass/fail
        await Examination.create({
          studentId,
          hasPassedAllCourses: !hasFailed,
          canGraduate: !hasFailed && financeApproved,
          status: "Pending"
        });

        created++;
      }
    }

    console.log(`✅ ${created} students marked as eligible for examination (with or without failed courses).`);
    process.exit();
  } catch (err) {
    console.error("❌ Error in markEligibleForExamination:", err.message);
    process.exit(1);
  }
};

markEligibleForExamination();
