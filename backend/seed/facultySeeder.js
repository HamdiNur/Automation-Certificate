// 📁 seed/facultySeeder.js

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
      const student = group.members[0]; // First member handles faculty clearance

      facultyRecords.push({
        studentId: student._id,
        groupId: group._id,
        thesisTitle: group.projectTitle || "Untitled Research Project",
        printedThesisSubmitted: Math.random() > 0.3,
        signedFormSubmitted: Math.random() > 0.2,
        softCopyReceived: Math.random() > 0.1,
        status: 'Pending',
        facultyRemarks: ''
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
