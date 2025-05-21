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
    await Library.deleteMany(); // 🧹 Clear old records

    const groups = await Group.find({
      'clearanceProgress.faculty.status': 'Approved'
    }).populate('members');

    if (!groups.length) {
      console.warn('❌ No groups approved by Faculty. Cannot seed Library.');
      return process.exit(0);
    }

    for (const group of groups) {
  const isLibraryApproved = group.clearanceProgress?.library?.status === 'Approved';

  await Library.create({
    groupId: group._id,
    members: group.members.map(m => m._id),
    facultyCleared: true,
    thesisBookReveiced: isLibraryApproved,
    status: isLibraryApproved ? 'Approved' : 'Pending',
    remarks: isLibraryApproved ? 'All books submitted.' : 'Waiting for thesis submission.',
    thesisBookReceivedDate: isLibraryApproved ? new Date() : null,
    clearedAt: isLibraryApproved ? new Date() : null,
    updatedAt: new Date()
  });

  console.log(`📚 Group ${group.groupNumber} → ${isLibraryApproved ? '✅ Approved' : '⏳ Pending'} for Library`);
}

    console.log(`🎉 Seeded ${groups.length} eligible Library records.`);
    process.exit();
  } catch (err) {
    console.error('❌ Seeding Library failed:', err.message);
    process.exit(1);
  }
};

seedLibraryClearance();
