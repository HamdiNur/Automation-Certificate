// ✅ Updated Group Seeder with full program and faculty info for 100 real students

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import { faker } from '@faker-js/faker';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const seedGroups = async () => {
  try {
    // Step 1: Clean up previous groups and reset students
    await Group.deleteMany();
    await Student.updateMany({}, { $unset: { groupId: "" } });
    console.log('🧹 Cleared existing groups and reset student groupIds.');

    // Step 2: Fetch all students (exactly 100 expected)
    const students = await Student.find({}).limit(100);
    if (students.length < 100) {
      console.error('❌ Not enough students found (need exactly 100)');
      return process.exit(1);
    }

    // Step 3: Shuffle students randomly
    const shuffled = students.sort(() => 0.5 - Math.random());

    // Step 4: Create 25 groups of 4 students each
    for (let i = 0; i < 25; i++) {
      const groupMembers = shuffled.slice(i * 4, i * 4 + 4);
      const group = await Group.create({
        groupNumber: i + 1,
        program: 'Bachelor of Science in Computer Science',
        faculty: 'Faculty of Information Technology',
        projectTitle: faker.helpers.arrayElement([
          'Smart Home Automation System',
          'E-commerce Website',
          'Chatbot for Customer Service',
          'Mobile Health Monitoring App',
          'Social Media Analytics Tool',
          'Online Learning Management System',
          'Inventory Management System',
          'Augmented Reality Shopping App',
          'Personal Finance Management App',
          'Blockchain-based Voting System',
          'IoT-based Weather Monitoring System',
          'Virtual Reality Game',
          'Travel Planning Application',
          'Digital Library System',
          'Remote Desktop Application',
          'Fitness Tracker Application',
          'Cybersecurity Awareness Game',
          'Voice-controlled Virtual Assistant',
          'Smart Traffic Management System',
          'Data Visualization Dashboard'
        ]),
        members: groupMembers.map((s) => s._id),
        phaseOneCleared: false,
        overallStatus: 'Pending',
        clearanceProgress: {
          faculty: { status: 'Pending' },
          library: { status: 'Pending' },
          lab: { status: 'Pending' }
        },
        clearedAt: null
      });

      // Update each student with their groupId
      for (const member of groupMembers) {
        await Student.findByIdAndUpdate(member._id, { groupId: group._id });
      }

      console.log(`✅ Group ${i + 1} created with students: ${groupMembers.map(s => s.studentId).join(', ')}`);
    }

    console.log(`🎉 Done! Created 25 groups, 4 students each.`);
    process.exit();
  } catch (err) {
    console.error('❌ Group seeding failed:', err.message);
    process.exit(1);
  }
};

seedGroups();
