// // 📁 scripts/fixGraduationEligibility.js

// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import { connectDB } from "../config/db.js";
// import Student from "../models/Student.js";
// import CourseRecord from "../models/course.js";
// import Clearance from "../models/Clearance.js";
// import Examination from "../models/examination.js";

// dotenv.config();
// await connectDB();

// const fixGraduationEligibility = async () => {
//   const students = await Student.find();

//   let updatedCount = 0;

//   for (const student of students) {
//     const exam = await Examination.findOne({ studentId: student._id });
//     if (!exam) continue;

//     const failed = await CourseRecord.exists({
//       studentId: student._id,
//       passed: false,
//     });

//     const finance = await Clearance.findOne({
//       studentId: student._id,
//       "finance.status": "Approved",
//     });

//     const passedAll = !failed;
//     const canGraduate = passedAll && !!finance;

//     exam.hasPassedAllCourses = passedAll;
//     exam.canGraduate = canGraduate;

//     await exam.save();
//     updatedCount++;
//   }

//   console.log(`✅ Updated ${updatedCount} examination records.`);
//   process.exit();
// };

// fixGraduationEligibility();
