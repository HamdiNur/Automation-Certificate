// // scripts/cleanupOrphanedFinance.js
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import Finance from '../models/finance.js';
// import Student from '../models/Student.js';
// import { connectDB } from '../config/db.js';

// dotenv.config();
// await connectDB();

// const cleanupOrphanedFinance = async () => {
//   const studentIds = await Student.find().distinct('_id');
//   const result = await Finance.deleteMany({
//     studentId: { $nin: studentIds }
//   });

//   console.log(`✅ Deleted ${result.deletedCount} orphaned finance records`);
//   process.exit();
// };

// cleanupOrphanedFinance();
