// ✅ backend/seed/seedLab.js — Seed Lab clearances only for groups approved in Faculty clearance,
// and approve lab clearance only if also approved in Library clearance.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lab from '../models/lab.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';

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
    // Clear existing Lab records
    await Lab.deleteMany();

    // Fetch only groups approved in Faculty clearance (your 10 random groups + any others)
    const groups = await Group.find({
      'clearanceProgress.faculty.status': 'Approved'
    }).populate('members');

    if (!groups.length) {
      console.warn('❌ No groups approved in Faculty clearance to seed lab records.');
      return process.exit(0);
    }

    for (const [index, group] of groups.entries()) {
      // Approve Lab clearance only if Library clearance is also approved
      const isLibraryApproved = group.clearanceProgress?.library?.status === 'Approved';
      const canApproveLab = isLibraryApproved;

      await Lab.create({
        groupId: group._id,
        members: group.members.map(m => m._id),
        returnedItems: canApproveLab ? 'All IoT kits returned' : '',
        issues: canApproveLab ? 'None' : IOT_ISSUES[index % IOT_ISSUES.length],
        status: canApproveLab ? 'Approved' : 'Pending',
        clearedAt: canApproveLab ? new Date() : null,
        approvedBy: canApproveLab ? 'System Auto' : '',
        updatedAt: new Date()
      });

      console.log(`🔧 Lab record seeded for Group ${group.groupNumber} → ${canApproveLab ? 'Approved' : 'Pending'}`);
    }

    console.log(`✅ Seeded ${groups.length} lab clearance records.`);
    process.exit();
  } catch (err) {
    console.error('❌ Lab seeding failed:', err.message);
    process.exit(1);
  }
};

seedLabClearance();
