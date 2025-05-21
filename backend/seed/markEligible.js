import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import CourseRecord from '../models/course.js';
import Finance from '../models/finance.js';
import Clearance from '../models/Clearance.js';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const markEligible = async () => {
  try {
    console.log('🔄 Resetting previous nameCorrectionEligible flags...');
    await Student.updateMany({}, { $set: { nameCorrectionEligible: false } });

    // ✅ Get all groups with approved faculty, library, and lab
    const clearedGroups = await Group.find({
      "clearanceProgress.faculty.status": "Approved",
      "clearanceProgress.library.status": "Approved",
      "clearanceProgress.lab.status": "Approved"
    }).populate('members');

    let totalMarked = 0;
    let totalSkipped = 0;

    for (const group of clearedGroups) {
      for (const student of group.members) {
        // ✅ Step 1: Ensure student passed all courses
        const failedCourse = await CourseRecord.findOne({
          studentId: student._id,
          passed: false
        });
        if (failedCourse) {
          totalSkipped++;
          continue;
        }

        // ✅ Step 2: Graduation fee is paid and approved
        const gradFeePaid = await Finance.exists({
          studentId: student._id,
          semester: 8,
          type: 'Payment',
          description: /Graduation Fee/i,
          status: 'Approved'
        });
        if (!gradFeePaid) {
          totalSkipped++;
          continue;
        }

        // ✅ Step 3: Optional - update finance clearance status
        await Clearance.updateOne(
          { studentId: student._id },
          {
            $set: {
              'finance.status': 'Cleared',
              'finance.clearedAt': new Date()
            }
          },
          { upsert: true } // ✅ In case Clearance doc doesn't exist
        );

        // ✅ Step 4: Mark as eligible
        await Student.findByIdAndUpdate(student._id, {
          nameCorrectionEligible: true
        });

        console.log(`✅ ${student.studentId} - ${student.fullName} marked eligible`);
        totalMarked++;
      }
    }

    console.log(`\n🎉 ${totalMarked} students marked as eligible for name correction.`);
    console.log(`🚫 ${totalSkipped} students were skipped due to failed courses or unpaid graduation fee.`);
    process.exit();
  } catch (err) {
    console.error('❌ Error during eligibility marking:', err.message);
    process.exit(1);
  }
};

markEligible();
