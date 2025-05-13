import express from 'express';
import {
  getPendingExamination,
  approveExamination,
  rejectExamination,
  uploadCertificate,
  scheduleAppointment,
  markCheckIn
} from '../controllers/examinationController.js';

const router = express.Router();

router.get('/pending', getPendingExamination);
router.post('/approve', approveExamination);
router.post('/reject', rejectExamination);
router.post('/upload-certificate', uploadCertificate);
router.post('/schedule-appointment', scheduleAppointment);
router.post('/check-in', markCheckIn);

export default router;