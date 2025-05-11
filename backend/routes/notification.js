import express from 'express';
import {
  getNotificationsByStudent,
  markAsRead,
  createNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/:studentId', getNotificationsByStudent);
router.post('/mark-read/:id', markAsRead);
router.post('/create', createNotification);

export default router;
