import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Student from '../models/Student.js';
import Faculty from '../models/faculty.js';
import Library from '../models/library.js';
import Lab from '../models/lab.js';
import Clearance from '../models/Clearance.js';
import Group from '../models/group.js'; // ✅ Register Group model

import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const seedClearances = async () => {
  try {
    console.log('🧹 Clearing old clearance records...');
    await Clearance.deleteMany();

    const students = await Student.find().populate('groupId');
    if (!students.length) {
      console.error('❌ No students found.');
      return process.exit(1);
    }

    for (const student of students) {
      const { _id: studentId, groupId } = student;
      if (!groupId) continue; // skip ungrouped students

      // Look up related records by groupId
      const faculty = await Faculty.findOne({ groupId: groupId._id });
      const library = await Library.findOne({ groupId: groupId._id });
      const lab = await Lab.findOne({ groupId: groupId._id });

      const clearance = {
        studentId,
        faculty: {
          status: faculty?.status || 'Pending',
          clearedAt: faculty?.clearedAt || null,
          rejectionReason: faculty?.rejectionReason || ''
        },
        library: {
          status: library?.status || 'Pending',
          clearedAt: library?.clearedAt || null
        },
        lab: {
          status: lab?.status || 'Pending',
          clearedAt: lab?.clearedAt || null
        },
        finance: {
          status: 'Pending',
          clearedAt: null
        },
        examination: {
          status: 'Pending',
          clearedAt: null
        },
        updatedAt: new Date()
      };

      // ✅ Final status is 'Approved' only if ALL stages are approved
      const isFullyCleared =
        clearance.faculty.status === 'Approved' &&
        clearance.library.status === 'Approved' &&
        clearance.lab.status === 'Approved' &&
        clearance.finance.status === 'Approved' &&
        clearance.examination.status === 'Approved';

      clearance.finalStatus = isFullyCleared ? 'Approved' : 'Incomplete';

      await Clearance.create(clearance);
      console.log(`✅ Clearance created for ${student.studentId}`);
    }

    console.log(`🎉 Seeded ${students.length} clearance records.`);
    process.exit();
  } catch (err) {
    console.error('❌ Failed to seed clearances:', err.message);
    process.exit(1);
  }
};

seedClearances();
