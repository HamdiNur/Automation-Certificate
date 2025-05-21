import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Library from '../models/library.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

await connectDB();

const seedLibraryClearance = async () => {
  try {
    console.log("⏳ Seeding Library Clearance Records...");
    await Library.deleteMany();

    // ✅ Ensure a library staff user exists
    let staff = await User.findOne({ role: 'library' });

    if (!staff) {
      staff = await User.create({
        name: 'Library Staff',
        email: 'library@university.edu',
        password: 'password123',
        role: 'library'
      });
      console.log("👤 Created dummy library staff user.");
    }

    const groups = await Group.find().populate('members');

    if (groups.length < 25) {
      throw new Error('At least 25 groups required to assign 15 cleared + 10 not cleared');
    }

    // ✅ Randomly pick 15 group indexes to mark as cleared
    const clearedIndexes = new Set();
    while (clearedIndexes.size < 15) {
      const randomIndex = Math.floor(Math.random() * groups.length);
      clearedIndexes.add(randomIndex);
    }

    for (const [index, group] of groups.entries()) {
      const isCleared = clearedIndexes.has(index);

      await Library.create({
        groupId: group._id,
        members: group.members.map(m => m._id),
        facultyCleared: isCleared,
        thesisBookReceived: isCleared, // ✅ correct field name
        thesisBookReceivedDate: isCleared ? new Date() : null,
        status: 'Pending',
        clearedAt: null,
        libraryStaffId: staff._id,
        remarks: isCleared ? 'Ready for approval' : 'Missing thesis copy',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`📚 Group ${group.groupNumber} → Faculty: ${isCleared ? '✔️ Cleared' : '❌ Pending'}, Thesis: ${isCleared ? '📘 Received' : '❌ Missing'}`);
    }

    console.log(`✅ Successfully seeded ${groups.length} library clearance records.`);
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedLibraryClearance();
