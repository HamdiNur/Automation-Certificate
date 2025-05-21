import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import Faculty from '../models/faculty.js'; // ✅ corrected name

import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const seedGroups = async () => {
  try {
    // Step 1: Clean existing
    await Group.deleteMany();
    await Faculty.deleteMany(); // ✅ Also clear Faculty records
    await Student.updateMany({}, { $unset: { groupId: "" } });
    console.log('🧹 Cleared previous groups, faculty records, and unlinked students.');

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
    const indexesToApprove = new Set();
    while (indexesToApprove.size < 10) {
      indexesToApprove.add(Math.floor(Math.random() * totalGroups));
    }

    // Step 5: Project titles
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

    // Step 6: Create groups
    for (let i = 0; i < totalGroups; i++) {
      const groupMembers = shuffled.slice(i * 4, i * 4 + 4);
      const isApproved = indexesToApprove.has(i);

      const clearance = {
        faculty: {
          status: isApproved ? 'Approved' : 'Pending',
          clearedBy: isApproved ? 'Dr. Amina Faculty' : null,
          date: isApproved ? new Date() : null,
        },
        library: {
          status: isApproved ? 'Approved' : 'Pending',
          clearedBy: isApproved ? 'Mr. Khalid Library' : null,
          date: isApproved ? new Date() : null,
        },
        lab: {
          status: isApproved ? 'Approved' : 'Pending',
          clearedBy: isApproved ? 'Lab Assistant Maryan' : null,
          date: isApproved ? new Date() : null,
        }
      };

      const group = await Group.create({
        groupNumber: i + 1,
        program: 'Bachelor of Science in Computer Science',
        faculty: 'Faculty of Information Technology',
        projectTitle: projectTitles[i],
        members: groupMembers.map(s => s._id),
        phaseOneCleared: isApproved,
        overallStatus: isApproved ? 'Approved' : 'Pending',
        clearanceProgress: clearance,
        clearedAt: isApproved ? new Date() : null
      });

      // 🔗 Update students with groupId
      for (const member of groupMembers) {
        await Student.findByIdAndUpdate(member._id, { groupId: group._id });
      }

      // ✅ Create Faculty clearance record if approved
      if (isApproved) {
        await Faculty.create({
          studentId: groupMembers[0]._id, // First member handles clearance
          groupId: group._id,
          thesisTitle: projectTitles[i],
          printedThesisSubmitted: true,
          signedFormSubmitted: true,
          softCopyReceived: true,
          status: 'Approved',
          clearedAt: new Date()
        });
      }

      console.log(
        `Group ${i + 1} → ${isApproved ? '✔ Approved' : '⏳ Pending'} | ${projectTitles[i]}`
      );
    }

    console.log('🎉 All 25 groups seeded successfully.');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedGroups();
