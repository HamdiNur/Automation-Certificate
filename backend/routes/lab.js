
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
  getLabHistory,
  getMyGroupLab,
} from '../controllers/labController.js';
import studentAuth from '../middleware/studentAuth.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllLabClearances);
router.get('/pending', getPendingLab);
router.get('/stats', getLabStats);
router.patch('/mark-ready-again', studentAuth, markLabReadyAgain);         // Student resubmit
router.patch('/admin/mark-ready-again', auth, markLabReadyAgain);  
router.get('/my-group', studentAuth, getMyGroupLab);   
router.get('/history/:groupId', getLabHistory); // ✅ ADD THIS LINE



// Add this line to your lab routes:
router.get('/profile',  getLabProfile);


router.get('/student/:studentId', getLabByStudentId);
router.get('/:groupId', getLabByGroupId);
router.post('/approve',auth, approveLab);

router.post('/reject',auth, rejectLab);

export default router;
