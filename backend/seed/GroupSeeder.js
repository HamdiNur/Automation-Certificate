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
    // Step 1: Clean up previous groups and unlink students
    await Group.deleteMany();
    await Student.updateMany({}, { $unset: { groupId: "" } });
    console.log('🧹 Cleared existing groups and student groupIds.');

    // Step 2: Fetch 100 students
    const students = await Student.find({}).limit(100);
    if (students.length < 100) {
      console.error('❌ Not enough students found (need exactly 100)');
      return process.exit(1);
    }

    // Step 3: Shuffle students randomly
    const shuffled = students.sort(() => 0.5 - Math.random());

    // Step 4: Randomly select 10 indexes out of 25 to be marked as 'approved'
    const totalGroups = 25;
    const indexesToApprove = new Set();
    while (indexesToApprove.size < 10) {
      indexesToApprove.add(Math.floor(Math.random() * totalGroups));
    }

    // Step 5: Create 25 groups of 4 students each
    for (let i = 0; i < totalGroups; i++) {
      const groupMembers = shuffled.slice(i * 4, i * 4 + 4);
      const isApproved = indexesToApprove.has(i); // ✅ These will be 'approved'

      const clearance = {
        faculty: {
          status: isApproved ? 'Cleared' : 'Pending',
          clearedBy: isApproved ? 'Dr. Amina Faculty' : null,
          date: isApproved ? new Date() : null,
        },
        library: {
          status: isApproved ? 'Cleared' : 'Pending',
          clearedBy: isApproved ? 'Mr. Khalid Library' : null,
          date: isApproved ? new Date() : null,
        },
        lab: {
          status: isApproved ? 'Cleared' : 'Pending',
          clearedBy: isApproved ? 'Lab Assistant Maryan' : null,
          date: isApproved ? new Date() : null,
        }
      };

      const group = await Group.create({
        groupNumber: i + 1,
        program: 'Bachelor of Science in Computer Science',
        faculty: 'Faculty of Information Technology',
        projectTitle: faker.helpers.arrayElement([
          // ✅ Expanded IoT titles
          'Smart Home Automation System',
          'IoT-based Weather Monitoring System',
          'Smart Traffic Management System',
          'IoT Smart Farming App',
          'IoT Waste Management System',
          'IoT Water Quality Monitoring',
          'IoT-based Smart Door Lock',
          'IoT Health Monitoring Wearable',
          'IoT Greenhouse Control System',
          'IoT-based Energy Consumption Tracker',
          // ✅ Mixed non-IoT titles
          'E-commerce Website',
          'Chatbot for Customer Service',
          'Mobile Health Monitoring App',
          'Social Media Analytics Tool',
          'Online Learning Management System',
          'Inventory Management System',
          'Augmented Reality Shopping App',
          'Blockchain-based Voting System',
          'Digital Library System',
          'Data Visualization Dashboard'
        ]),
        members: groupMembers.map((s) => s._id),
        phaseOneCleared: isApproved,
        overallStatus: isApproved ? 'approved' : 'Pending', // 🔧 FIXED TO MATCH ENUM
        clearanceProgress: clearance,
        clearedAt: isApproved ? new Date() : null
      });

      // Update each student with their group ID
      for (const member of groupMembers) {
        await Student.findByIdAndUpdate(member._id, { groupId: group._id });
      }

      console.log(
        `Group ${i + 1} → ${isApproved ? '✔ approved' : '⏳ Pending'} | Members: ${groupMembers
          .map((s) => s.studentId)
          .join(', ')}`
      );
    }

    console.log('✅ Done! 25 groups created — 10 randomly approved, 15 pending.');
    process.exit();
  } catch (err) {
    console.error('❌ Group seeding failed:', err.message);
    process.exit(1);
  }
};

seedGroups();
