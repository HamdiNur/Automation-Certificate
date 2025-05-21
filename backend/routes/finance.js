// import express from 'express';
// import {
//   getPendingFinance,
//   approveFinance,
//   rejectFinance,
//   updatePayment
// } from '../controllers/financeController.js';

// const router = express.Router();

// router.get('/pending', getPendingFinance);
// router.post('/approve', approveFinance);
// router.post('/reject', rejectFinance);
// router.post('/update-payment', updatePayment);

// export default router;
// routes/finance.js
import express from 'express';
import {
  getPendingFinance,
  approveFinance,
  rejectFinance,
  updatePayment,
  getStudentFinanceSummary,
  getFinanceStats,
  getStudentsWhoPaidGraduationFee
 

} from '../controllers/financeController.js';

const router = express.Router();

router.get('/pending', getPendingFinance);
router.post('/approve', approveFinance);
router.post('/reject', rejectFinance);
router.put('/update-payment', updatePayment);
router.get('/finance-summary/:studentId', getStudentFinanceSummary);
router.get('/stats', getFinanceStats);
router.get('/graduation-paid', getStudentsWhoPaidGraduationFee); // 👈 New route


export default router;
