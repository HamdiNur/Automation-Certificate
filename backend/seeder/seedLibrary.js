// ✅ Updated seedLibrary.js with realistic mixed clearance data

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import Library from '../models/library.js';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const seedLibraryClearance = async () => {
  try {
    await Library.deleteMany(); // Clean old records

    const groups = await Group.find().populate('members');

    for (const [index, group] of groups.entries()) {
      const isEven = index % 2 === 0;

      await Library.create({
        groupId: group._id,
        members: group.members.map(m => m._id),
        facultyCleared: isEven,
        thesisBookReveiced: isEven,
        status: isEven ? 'Approved' : 'Pending',
        remarks: isEven ? 'All books submitted.' : 'Missing thesis copy.',
        thesisBookReceivedDate: isEven ? new Date() : null,
        clearedAt: isEven ? new Date() : null,
        updatedAt: new Date()
      });

      console.log(`📚 Group ${group.groupNumber} → ${isEven ? 'Approved' : 'Pending'}`);
    }

    console.log(`🎉 Seeded ${groups.length} library records.`);
    process.exit();
  } catch (err) {
    console.error('❌ Seeding library failed:', err.message);
    process.exit(1);
  }
};

seedLibraryClearance();
