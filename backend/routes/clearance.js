import express from 'express';
const router = express.Router(); // ✅ Define it before use

import { getPhaseOneClearedStudents, getStudentClearance } from '../controllers/clearanceController.js';


router.get('/cleared-phaseone', getPhaseOneClearedStudents);


// Only clearance routes should go here
router.get('/:studentId', getStudentClearance);

export default router;
