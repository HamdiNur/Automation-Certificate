import express from 'express';
import { registerStudent, loginStudent,getAllStudents , getStudentsWithLabStatus} from '../controllers/studentController.js';

const router = express.Router();

// Register route
router.post('/register', registerStudent);  // POST /api/students/register

// ✅ Login route
router.post('/login', loginStudent);        // POST /api/students/login
router.get('/', getAllStudents);  // GET /api/students
router.get('/with-lab-status', getStudentsWithLabStatus);



export default router;
