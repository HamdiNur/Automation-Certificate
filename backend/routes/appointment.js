import express from 'express';
import {
  createAppointment,
  rescheduleAppointment,
  checkInAppointment,
  getAppointmentByStudent,
  getAllAppointments,
  getAppointmentStatusByStudent
} from '../controllers/appointmentController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', createAppointment);
router.post('/reschedule', rescheduleAppointment);
router.post('/check-in',auth,checkInAppointment);
router.get('/student/:studentId', getAppointmentByStudent);
router.get("/status/:studentId", getAppointmentStatusByStudent);

router.get('/', getAllAppointments);

export default router;