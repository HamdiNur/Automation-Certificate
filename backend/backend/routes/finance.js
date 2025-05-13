import express from 'express';
import {
  getPendingFinance,
  approveFinance,
  rejectFinance,
  updatePayment
} from '../controllers/financeController.js';

const router = express.Router();

router.get('/pending', getPendingFinance);
router.post('/approve', approveFinance);
router.post('/reject', rejectFinance);
router.post('/update-payment', updatePayment);

export default router;