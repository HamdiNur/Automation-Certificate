import express from 'express';
const router = express.Router();

import {
  approveClearance,
  getPhaseOneClearedStudents,
  getStudentClearance,
  startIndividualClearance,
  checkGroupClearanceStatus
} from '../controllers/clearanceController.js';

// ✅ Get all students who cleared group phase (Faculty, Library, Lab)
router.get('/cleared-phaseone', getPhaseOneClearedStudents);

// ✅ Start individual clearance after group phase completion
router.patch('/start-individual/:studentId', startIndividualClearance);

// ✅ Check group clearance status for a student
router.get('/group-status/:studentId', checkGroupClearanceStatus);

// ✅ Get full clearance steps for a student
router.get('/:studentId', getStudentClearance);

// ✅ Approve final clearance and schedule appointment
router.post('/approve', approveClearance);

export default router;
