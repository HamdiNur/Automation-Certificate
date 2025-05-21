import express from 'express';
import {
  getAllLabClearances,
  getLabByGroupId,
  getLabByStudentId,
  getPendingLab,
  approveLab,
  rejectLab
} from '../controllers/labController.js';

const router = express.Router();

router.get('/', getAllLabClearances);
router.get('/pending', getPendingLab);
router.get('/student/:studentId', getLabByStudentId);
router.get('/:groupId', getLabByGroupId);
router.post('/approve', approveLab);
router.post('/reject', rejectLab);

export default router;
