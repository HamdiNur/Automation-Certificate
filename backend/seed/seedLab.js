<<<<<<< HEAD
// ✅ backend/seed/seedLab.js — Updated Logic
=======
// ✅ backend/seed/seedLab.js — Enhanced with IoT equipment issues
>>>>>>> master

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lab from '../models/lab.js';
import Student from '../models/Student.js';
import Group from '../models/group.js';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const IOT_ISSUES = [
  'Missing RFID sensor',
  'Damaged Arduino board',
  'Loose Raspberry Pi cable',
  'Unreturned microcontroller kit',
  'Disconnected temperature sensor',
  'Faulty ultrasonic sensor',
<<<<<<< HEAD
  'Overheated WiFi module',
  'Broken power adapter'
];

// Helper: IoT detection
const isIoTProject = (title = '') =>
  title.toLowerCase().includes('iot') || title.toLowerCase().includes('smart');

=======
  'Missing jumper wires',
  'Overheated WiFi module',
  'Lost IoT manual',
  'Broken power adapter'
];

>>>>>>> master
const seedLabClearance = async () => {
  try {
    await Lab.deleteMany();

<<<<<<< HEAD
    const allGroups = await Group.find().populate('members');

    const iotGroups = allGroups.filter(group =>
      isIoTProject(group.projectTitle)
    ).slice(0, 15); // Seed only 15 IoT groups

    if (iotGroups.length === 0) {
      console.warn('⚠ No IoT-related groups found.');
    }

    for (const [index, group] of iotGroups.entries()) {
      let returnedItems = '';
      let issues = '';

      // 🔁 Even indexes: Returned items, may have issues
      if (index % 2 === 0) {
        returnedItems = 'Laptop, Router, Sensor Kit';

        // 50% of returned items have issues
        if (index % 4 === 0) {
          issues = IOT_ISSUES[index % IOT_ISSUES.length];
        } else {
          issues = 'None';
        }
      }

      // 🔒 If nothing was returned → issues = 'None'
      if (!returnedItems) {
        issues = 'None';
      }
=======
    const groups = await Group.find().populate('members');

    for (const [index, group] of groups.entries()) {
      const isEven = index % 2 === 0;
>>>>>>> master

      await Lab.create({
        groupId: group._id,
        members: group.members.map(m => m._id),
<<<<<<< HEAD
        returnedItems,
        issues,
        status: 'Pending',
        clearedAt: null,
        approvedBy: '',
        updatedAt: new Date()
      });

      console.log(
        `🔬 Group ${group.groupNumber} → Returned: "${returnedItems || '❌'}" | Issues: "${issues}"`
      );
    }

    console.log(`✅ Seeded ${iotGroups.length} lab clearance records (all Pending).`);
=======
        returnedItems: isEven ? 'All IoT kits returned' : '',
        issues: isEven ? 'None' : IOT_ISSUES[index % IOT_ISSUES.length],
        status: isEven ? 'Approved' : 'Pending',
        clearedAt: isEven ? new Date() : null,
        approvedBy: isEven ? 'System Auto' : '',
        updatedAt: new Date()
      });

      console.log(`🔧 Lab record seeded for Group ${group.groupNumber} → ${isEven ? 'Approved' : 'Pending'}`);
    }

    console.log(`✅ Seeded ${groups.length} lab clearance records.`);
>>>>>>> master
    process.exit();
  } catch (err) {
    console.error('❌ Lab seeding failed:', err.message);
    process.exit(1);
  }
};

seedLabClearance();
