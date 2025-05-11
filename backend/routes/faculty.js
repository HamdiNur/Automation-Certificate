import express from 'express';
import {
  getPendingFaculty,
  approveFaculty,
  rejectFaculty
} from '../controllers/facultyController.js';

const router = express.Router();

router.get('/pending', getPendingFaculty);
router.post('/approve', approveFaculty);
router.post('/reject', rejectFaculty);

export default router;
