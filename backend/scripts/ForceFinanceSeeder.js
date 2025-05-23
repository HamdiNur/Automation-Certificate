// 📁 scripts/ForceFinanceSeeder.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Clearance from '../models/Clearance.js';
import Finance from '../models/finance.js';
import { generateFinanceForStudent } from '../utils/financeGenerator.js';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const forceFinanceSeed = async () => {
  try {
    console.log("🔍 Fetching students who cleared faculty, library, and lab...");

    const cleared = await Clearance.find({
      'faculty.status': 'Approved',
      'library.status': 'Approved',
      'lab.status': 'Approved',
    }).select('studentId');

    const studentIds = cleared.map((c) => c.studentId);

    let regenerated = 0;

    for (const id of studentIds) {
      // 🧹 Remove old finance records to regenerate from scratch
      await Finance.deleteMany({ studentId: id });

      // 🚀 Regenerate
      await generateFinanceForStudent(id);

      // 📝 Update clearance state
      await Clearance.updateOne(
        { studentId: id },
        {
          $set: {
            'finance.eligibleForFinance': true,
            'finance.status': 'Pending',
          }
        }
      );

      regenerated++;
    }

    console.log(`✅ Finance regenerated for ${regenerated} students.`);
    process.exit();
  } catch (err) {
    console.error("❌ Failed to seed finance:", err.message);
    process.exit(1);
  }
};

forceFinanceSeed();
