import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

import Group from '../models/group.js';
import Student from '../models/Student.js';
import Faculty from '../models/faculty.js';
import Library from '../models/library.js'; // 
import Lab from '../models/lab.js';     
import { connectDB } from '../config/db.js';
import projectTitles from '../utils/data/projectTitles.js';

await connectDB();

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

const seedGroups = async () => {
  try {
    await Group.deleteMany();
    await Faculty.deleteMany();
    // Add this at the top of seedGroups()
    await Library.deleteMany();
    await Lab.deleteMany();  
    await Student.updateMany({}, { $unset: { groupId: '', role: '' } });

    console.log('🧹 Previous groups, faculty, and student links cleared');

    const year = 2021;
    const students = await Student.find({ yearOfAdmission: year });
    const shuffled = shuffle(students);

    const groupSize = 4;
    const groupCount = Math.floor(shuffled.length / groupSize);

    if (projectTitles.length < groupCount) {
      throw new Error(`❌ Not enough project titles. Required: ${groupCount}, Provided: ${projectTitles.length}`);
    }

    for (let i = 0; i < groupCount; i++) {
      const members = shuffled.slice(i * groupSize, i * groupSize + groupSize);
      const title = projectTitles[i];

      const group = await Group.create({
        groupNumber: i + 1,
        admissionYear: year,
        program: members[0].program,
        faculty: members[0].faculty,
        projectTitle: title,
        members: members.map((m, idx) => ({
          student: m._id,
          role: idx === 0 ? 'Leader' : 'Member'
        })),
        phaseOneCleared: false,
        overallStatus: 'Pending',
        clearanceProgress: {
        },
        clearedAt: null
      });

      for (let j = 0; j < members.length; j++) {
        await Student.findByIdAndUpdate(members[j]._id, {
          groupId: group._id,
          role: j === 0 ? 'Leader' : 'Member'
        });
      }

      console.log(`📦 Group ${i + 1} created → ${title}`);
    }

    console.log(`✅ Finished. ${groupCount} groups created.`);
    process.exit();
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

seedGroups();
