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

        const alreadyExists = await Examination.exists({ studentId });
        if (alreadyExists) {
          skipped++;
          continue;
        }

        const hasFailed = await CourseRecord.exists({
          studentId,
          passed: false
        });

        const financeApproved = await Finance.exists({
          studentId,
          type: "Payment",
          description: /Graduation Fee/i,
          status: "Approved"
        });

        await Examination.create({
          studentId,
          hasPassedAllCourses: !hasFailed,
          canGraduate: !hasFailed && financeApproved,
          clearanceStatus: "Pending" // ✅ FIXED HERE
        });

        created++;
      }
    }

    console.log(`✅ ${created} students marked as eligible for examination.`);
    console.log(`ℹ️ ${skipped} students already had examination records.`);
    process.exit();
  } catch (err) {
    console.error("❌ Error in markEligibleForExamination:", err.message);
    process.exit(1);
  }
};

markEligibleForExamination();
