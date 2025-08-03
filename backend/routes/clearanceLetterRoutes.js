// 📁 routes/clearanceLetterRoutes.js
import express from 'express';
import { getClearanceLetterData } from '../controllers/clearanceLetterController.js';

const router = express.Router();

// Endpoint: /api/clearanceletter/:studentId
router.get('/:studentId', getClearanceLetterData);

export default router;
