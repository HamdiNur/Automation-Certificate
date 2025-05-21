<<<<<<< HEAD
import mongoose from 'mongoose'; 
import dotenv from 'dotenv';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import { faker } from '@faker-js/faker';
=======
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../models/group.js';
import Student from '../models/Student.js';
>>>>>>> master
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const seedGroups = async () => {
  try {
<<<<<<< HEAD
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
=======
    // Step 1: Clean existing
    await Group.deleteMany();
    await Student.updateMany({}, { $unset: { groupId: "" } });
    console.log('🧹 Cleared previous groups and unlinked students.');

    // Step 2: Fetch 100 students
    const students = await Student.find().limit(100);
    if (students.length < 100) {
      console.error('❌ Not enough students (100 required)');
      return process.exit(1);
    }

    // Step 3: Shuffle and group into 25 groups of 4
    const shuffled = students.sort(() => 0.5 - Math.random());
    const totalGroups = 25;

    // Step 4: 10 random indexes to be Approved
>>>>>>> master
    const indexesToApprove = new Set();
    while (indexesToApprove.size < 10) {
      indexesToApprove.add(Math.floor(Math.random() * totalGroups));
    }

<<<<<<< HEAD
    // Step 5: Create 25 groups of 4 students each
    for (let i = 0; i < totalGroups; i++) {
      const groupMembers = shuffled.slice(i * 4, i * 4 + 4);
      const isApproved = indexesToApprove.has(i); // ✅ These will be 'approved'

      const clearance = {
        faculty: {
          status: isApproved ? 'Cleared' : 'Pending',
=======
    // Unique 25 project titles
    const projectTitles = [
      'Ride-Sharing System',
      'Smart Parking Assistant',
      'Salon Appointment Booking App',
      'Food Delivery App with EVC+',
      'Freelancer Hiring Platform',
      'Online Exam Monitoring System',
      'Blood Donation Match App',
      'Mental Health Chatbot',
      'University Clearance System',
      'Virtual Event Ticketing Platform',
      'Online Car Rental System',
      'Clinic Queue Management App',
      'Digital Marketplace for Farmers',
      'Real Estate Listing App',
      'Pet Adoption Portal',
      'Online Banking Dashboard',
      'Bus Tracking & Ticketing System',
      'NGO Donation Tracker',
      'Hotel Reservation Website',
      'Smart Inventory App',
      'Tutoring Platform with Video Chat',
      'Lost & Found App for Campus',
      'Online Thesis Review System',
      'Language Learning App (Somali)',
      'Virtual Library with PDF Preview'
    ];

    // Step 5: Loop to create groups
    for (let i = 0; i < totalGroups; i++) {
      const groupMembers = shuffled.slice(i * 4, i * 4 + 4);
      const isApproved = indexesToApprove.has(i);

      const clearance = {
        faculty: {
          status: isApproved ? 'Approved' : 'Pending',
>>>>>>> master
          clearedBy: isApproved ? 'Dr. Amina Faculty' : null,
          date: isApproved ? new Date() : null,
        },
        library: {
<<<<<<< HEAD
          status: isApproved ? 'Cleared' : 'Pending',
=======
          status: isApproved ? 'Approved' : 'Pending',
>>>>>>> master
          clearedBy: isApproved ? 'Mr. Khalid Library' : null,
          date: isApproved ? new Date() : null,
        },
        lab: {
<<<<<<< HEAD
          status: isApproved ? 'Cleared' : 'Pending',
=======
          status: isApproved ? 'Approved' : 'Pending',
>>>>>>> master
          clearedBy: isApproved ? 'Lab Assistant Maryan' : null,
          date: isApproved ? new Date() : null,
        }
      };

      const group = await Group.create({
        groupNumber: i + 1,
        program: 'Bachelor of Science in Computer Science',
        faculty: 'Faculty of Information Technology',
<<<<<<< HEAD
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
=======
        projectTitle: projectTitles[i],
        members: groupMembers.map(s => s._id),
        phaseOneCleared: isApproved,
        overallStatus: isApproved ? 'Approved' : 'Pending',
>>>>>>> master
        clearanceProgress: clearance,
        clearedAt: isApproved ? new Date() : null
      });

<<<<<<< HEAD
      // Update each student with their group ID
=======
>>>>>>> master
      for (const member of groupMembers) {
        await Student.findByIdAndUpdate(member._id, { groupId: group._id });
      }

      console.log(
<<<<<<< HEAD
        `Group ${i + 1} → ${isApproved ? '✔ approved' : '⏳ Pending'} | Members: ${groupMembers
          .map((s) => s.studentId)
          .join(', ')}`
      );
    }

    console.log('✅ Done! 25 groups created — 10 randomly approved, 15 pending.');
    process.exit();
  } catch (err) {
    console.error('❌ Group seeding failed:', err.message);
=======
        `Group ${i + 1} → ${isApproved ? '✔ Approved' : '⏳ Pending'} | ${projectTitles[i]}`
      );
    }

    console.log('🎉 All 25 groups seeded successfully.');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
>>>>>>> master
    process.exit(1);
  }
};

seedGroups();
