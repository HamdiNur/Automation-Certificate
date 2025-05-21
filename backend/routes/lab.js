import express from 'express';
import {
  getAllLabClearances,
  getPendingLab,
  approveLab,
  rejectLab,
  updateLabStatus,
  getLabByGroupId,
  getLabByStudentId,
  getLabStats,
} from '../controllers/labController.js';

const router = express.Router();

router.get('/all', getAllLabClearances);
router.get('/pending', getPendingLab);
router.post('/approve', approveLab);
router.post('/reject', rejectLab);
router.post('/update-status', updateLabStatus);
router.get('/group/:groupId', getLabByGroupId);
router.get('/student/:studentId', getLabByStudentId);
router.get('/stats', getLabStats);

export default router;
