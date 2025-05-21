import express from 'express';
import {
  createCourseRecords,
  updateCourseStatus,
  getStudentCourses,
  checkEligibility,
  getAllStudentCourses,
  getAllPassedStudents
} from '../controllers/courseController.js';

const router = express.Router();

// 🔹 Create new course records for a student
router.post('/create', createCourseRecords);

// 🔹 Update pass/fail status of a course
router.put('/update', updateCourseStatus);

// 🔹 Get all courses of a student
router.get('/student/:studentId', getStudentCourses);

// 🔹 Check if student is eligible to graduate (passed all courses)
router.get('/check/:idOrCode', checkEligibility);
router.get('/passed/all', getAllPassedStudents);


// ✅ New route to fetch all students' courses
router.get('/all', getAllStudentCourses);
export default router;
