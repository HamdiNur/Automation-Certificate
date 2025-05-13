import express from 'express';
import {
  getPendingLab,
  approveLab,
  rejectLab
} from '../controllers/labController.js';

const router = express.Router();

router.get('/pending', getPendingLab);
router.post('/approve', approveLab);
router.post('/reject', rejectLab);

export default router;