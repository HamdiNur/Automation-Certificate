// 📁 backend/seed/seedPending.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Finance from '../models/finance.js';
import Student from '../models/Student.js';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const students = await Student.find().limit(10);

for (let student of students) {
  await Finance.create({
    studentId: student._id,
    semester: 8,
    description: "Tuition Charge - $410",
    amount: 410,
    type: "Charge",
    status: "Pending"
    
  });
}

console.log("✅ Inserted 10 pending finance records.");
process.exit();
