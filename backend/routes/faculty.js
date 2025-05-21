import express from 'express';
import {
  getPendingFaculty,
  approveFaculty,
  rejectFaculty,
  getFacultyStats,
  updateFacultyChecklist
} from '../controllers/facultyController.js';

const router = express.Router();

router.get('/pending', getPendingFaculty);
router.post('/approve', approveFaculty);
router.post('/reject', rejectFaculty);
router.get('/stats', getFacultyStats); // ✅ New route for dashboard
router.patch('/update-checklist', updateFacultyChecklist); // ⬅️ Add this route


export default router;
