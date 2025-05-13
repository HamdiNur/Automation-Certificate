// 📁 routes/library.js
import express from 'express';
import {
  getPendingLibrary,
  approveLibrary,
  rejectLibrary
} from '../controllers/libraryController.js';

const router = express.Router();

router.get('/pending', getPendingLibrary);
router.post('/approve', approveLibrary);
router.post('/reject', rejectLibrary);

export default router;
