import dotenv from 'dotenv';
dotenv.config();

<<<<<<< HEAD
import Student from '../models/Student.js';
=======
>>>>>>> master
import mongoose from 'mongoose';
import Library from '../models/library.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';


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
    await Library.deleteMany(); // Clean old records

    const groups = await Group.find().populate('members');

    for (const [index, group] of groups.entries()) {
      const isEven = index % 2 === 0;

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
