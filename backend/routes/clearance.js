import express from 'express';
const router = express.Router(); // ✅ Define it before use

import { getStudentClearance } from '../controllers/clearanceController.js';

// Only clearance routes should go here
router.get('/:studentId', getStudentClearance);

export default router;
