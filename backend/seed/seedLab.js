// ✅ backend/seed/seedLab.js — Enhanced with IoT equipment issues

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
  'Missing jumper wires',
  'Overheated WiFi module',
  'Lost IoT manual',
  'Broken power adapter'
];

const seedLabClearance = async () => {
  try {
    await Lab.deleteMany();

    const groups = await Group.find().populate('members');

    for (const [index, group] of groups.entries()) {
      const isEven = index % 2 === 0;

      await Lab.create({
        groupId: group._id,
        members: group.members.map(m => m._id),
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
    process.exit();
  } catch (err) {
    console.error('❌ Lab seeding failed:', err.message);
    process.exit(1);
  }
};

seedLabClearance();
