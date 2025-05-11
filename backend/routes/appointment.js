import express from 'express';
import {
  createAppointment,
  rescheduleAppointment,
  checkInAppointment,
  getAppointmentByStudent,
  getAllAppointments
} from '../controllers/appointmentController.js';

const router = express.Router();

router.post('/create', createAppointment);
router.post('/reschedule', rescheduleAppointment);
router.post('/check-in', checkInAppointment);
router.get('/student/:studentId', getAppointmentByStudent);
router.get('/', getAllAppointments);

export default router;