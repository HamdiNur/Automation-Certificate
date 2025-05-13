import express from 'express';
import { registerStudent, loginStudent } from '../controllers/studentController.js';

const router = express.Router();

// Register route
router.post('/register', registerStudent);  // POST /api/students/register

// ✅ Login route
router.post('/login', loginStudent);        // POST /api/students/login

export default router;
