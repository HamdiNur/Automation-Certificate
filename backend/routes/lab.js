
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

  markLabReadyAgain,
} from '../controllers/labController.js';
import studentAuth from '../middleware/studentAuth.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllLabClearances);
router.get('/pending', getPendingLab);
router.get('/stats', getLabStats);
router.patch('/mark-ready-again', studentAuth, markLabReadyAgain);         // Student resubmit
router.patch('/admin/mark-ready-again', auth, markLabReadyAgain);     


// Add this line to your lab routes:
router.get('/profile',  getLabProfile);


router.get('/student/:studentId', getLabByStudentId);
router.get('/:groupId', getLabByGroupId);
router.post('/approve', approveLab);

router.post('/reject', rejectLab);

export default router;
