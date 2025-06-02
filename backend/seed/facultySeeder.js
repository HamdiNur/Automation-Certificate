// 📁 seed/facultySeeder.js




///we don't need you any more 

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Faculty from '../models/faculty.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const seedFaculty = async () => {
  try {
    await Faculty.deleteMany();

    const groups = await Group.find().populate('members');
    const facultyRecords = [];

    for (const group of groups) {
      if (!group.members.length) {
        console.warn(`⚠️ Group ${group.groupNumber} has no members. Skipping.`);
        continue;
      }

      const student = group.members[0];
      const facultyStatus = group.clearanceProgress?.faculty?.status || 'Pending';
      const clearedAt = facultyStatus === 'Approved' ? new Date() : null;

facultyRecords.push({
  studentId: student._id,
  groupId: group._id,
  admissionYear: group.admissionYear,
  groupNumber: group.groupNumber,
  thesisTitle: group.projectTitle || "Untitled Research Project",
  printedThesisSubmitted: Math.random() > 0.3,
  signedFormSubmitted: Math.random() > 0.2,
  softCopyReceived: Math.random() > 0.1,
  status: facultyStatus,
  clearedAt: facultyStatus === 'Approved' ? group.clearedAt : null,
  facultyRemarks: facultyStatus === 'Rejected' ? 'Auto-rejected from seed' : '',
  rejectionReason: facultyStatus === 'Rejected' ? 'Auto-rejected from seed' : ''
});

    }

    await Faculty.insertMany(facultyRecords);
    console.log(`✅ Inserted ${facultyRecords.length} faculty clearance records.`);
    process.exit();
  } catch (err) {
    console.error('❌ Faculty seeding failed:', err.message);
    process.exit(1);
  }
};

seedFaculty();
