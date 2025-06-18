// routes/finance.js
import express from 'express';
import {
  getPendingFinance,
  // approveFinance,
  rejectFinance,
  // updatePayment,
  getStudentFinanceSummary,
  getFinanceStats,
  getStudentsWhoPaidGraduationFee,
  processStudentPayment,
  adminForceApproveFinance,
  adminAddManualPayment
} from '../controllers/financeController.js';

// import checkClearance from '../middleware/checkClearance.js';
import Student from '../models/Student.js';
import { generateFinanceForStudent } from '../utils/financeGenerator.js'; // ✅ Import utility
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// 📌 ROUTES
router.get('/pending', getPendingFinance);
// router.post('/approve', approveFinance);
router.post('/reject', rejectFinance);
// 🔹 Real EVC payment (used by "Pay via EVC" button)
router.post('/pay', processStudentPayment); // ✅ YOUR KEY ROUTE


router.post('/admin-approve', auth, adminForceApproveFinance);
router.post('/manual-payment', adminAddManualPayment);

// router.put('/update-payment', updatePayment);
router.get('/finance-summary/:studentId', getStudentFinanceSummary);


router.get('/stats', getFinanceStats);
router.get('/graduation-paid', getStudentsWhoPaidGraduationFee); // ✅ Extra route

// ✅ NEW: Trigger finance generation manually (optional but powerful)
router.post('/generate/:studentId', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await generateFinanceForStudent(student._id);
    res.status(200).json({ message: '✅ Finance generated successfully.' });
  } catch (err) {
    res.status(500).json({ message: '❌ Error generating finance', error: err.message });
  }
});

export default router;
