// ✅ backend/seed/seedLab.js — Updated Logic

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
  'Overheated WiFi module',
  'Broken power adapter'
];

// Helper: IoT detection
const isIoTProject = (title = '') =>
  title.toLowerCase().includes('iot') || title.toLowerCase().includes('smart');

const seedLabClearance = async () => {
  try {
    await Lab.deleteMany();

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

      await Lab.create({
        groupId: group._id,
        members: group.members.map(m => m._id),
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
    process.exit();
  } catch (err) {
    console.error('❌ Lab seeding failed:', err.message);
    process.exit(1);
  }
};

seedLabClearance();
