import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Student from '../models/Student.js';
import Faculty from '../models/faculty.js';
import Library from '../models/library.js';
import Lab from '../models/lab.js';
import Clearance from '../models/Clearance.js';
import Group from '../models/group.js';

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

    let created = 0;
    let skipped = 0;

    for (const student of students) {
      const { _id: studentId, groupId } = student;
      if (!groupId) {
        skipped++;
        continue; // skip ungrouped students
      }

      const faculty = await Faculty.findOne({ groupId: groupId._id });
      const library = await Library.findOne({ groupId: groupId._id });
      const lab = await Lab.findOne({ groupId: groupId._id });

      const isPhaseOneCleared =
        faculty?.status === 'Approved' &&
        library?.status === 'Approved' &&
        lab?.status === 'Approved';

      if (!isPhaseOneCleared) {
        console.log(`⏩ Skipping ${student.studentId} — Phase One not cleared`);
        skipped++;
        continue;
      }

      const clearance = {
        studentId,
        faculty: {
          status: faculty.status,
          clearedAt: faculty.clearedAt || null,
          rejectionReason: faculty.rejectionReason || ''
        },
        library: {
          status: library.status,
          clearedAt: library.clearedAt || null
        },
        lab: {
          status: lab.status,
          clearedAt: lab.clearedAt || null
        },
        finance: {
          status: 'Pending',
          clearedAt: null
        },
        examination: {
          status: 'Pending',
          clearedAt: null
        },
        finalStatus: 'Incomplete', // ✅ Set final status here
        updatedAt: new Date()
      };

      await Clearance.create(clearance);
      console.log(`✅ Phase One Clearance created for ${student.studentId}`);
      created++;
    }

    console.log(`\n🎉 Clearance seeding complete.`);
    console.log(`🟢 Created: ${created}`);
    console.log(`🟡 Skipped: ${skipped}`);
    process.exit();
  } catch (err) {
    console.error('❌ Failed to seed clearances:', err.message);
    process.exit(1);
  }
};

seedClearances();
