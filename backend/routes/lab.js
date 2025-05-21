
import express from 'express';

import {
  getAllLabClearances,
  getLabStats,
  getLabByGroupId,
  getLabByStudentId,
  getPendingLab,
  approveLab,
  rejectLab,
  getLabProfile,
} from '../controllers/labController.js';

const router = express.Router();

router.get('/', getAllLabClearances);
router.get('/pending', getPendingLab);
router.get('/stats', getLabStats);
// Add this line to your lab routes:
router.get('/profile',  getLabProfile);


router.get('/student/:studentId', getLabByStudentId);
router.get('/:groupId', getLabByGroupId);
router.post('/approve', approveLab);

router.post('/reject', rejectLab);

export default router;
