import express from 'express';
import {
  getPendingFaculty,
  approveFaculty,
  rejectFaculty,
  // getFacultyStats,
  updateFacultyChecklist,
  startFacultyClearance,
  getFacultyHistory,
  markReadyAgain,
  getApprovedFacultyGroups,
  getFacultyStatusCount,
  getRejectedFacultyGroups,
  getMyGroupFaculty,
  markAsIncomplete
} from '../controllers/facultyController.js';
import studentAuth from '../middleware/studentAuth.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/start-clearance', studentAuth, startFacultyClearance);
// routes/facultyRoute.js
router.get('/status-count', getFacultyStatusCount);

router.get('/pending', auth,getPendingFaculty);
router.post('/approve',auth, approveFaculty);
router.post('/reject',auth, rejectFaculty);
router.get('/rejected', auth, getRejectedFacultyGroups); 
router.post("/incomplete",auth, markAsIncomplete);

router.get('/my-group', studentAuth, getMyGroupFaculty);
// For students
router.patch('/mark-ready-again', studentAuth, markReadyAgain);

router.patch('/admin/mark-ready-again', auth, markReadyAgain);         // For admin
router.get('/approved', auth,getApprovedFacultyGroups);

// router.get('/stats', getFacultyStats); // New route for dashboard
router.patch('/update-checklist',auth, updateFacultyChecklist); //  this route
router.get('/history/:groupId', auth, getFacultyHistory); // 🆕 See logs for this group


export default router;
