import express from 'express';
<<<<<<< HEAD
import { registerStudent, loginStudent,getAllStudents , getStudentsWithLabStatus} from '../controllers/studentController.js';
=======
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import {
  registerStudent,
  loginStudent,
  getAllStudents,
  getStudentById,
  getEligibleForNameCorrection,
  markNameCorrectionRequest,
  uploadCorrectionFile
} from '../controllers/studentController.js';
>>>>>>> master

const router = express.Router();

// 🗂️ Ensure upload folder exists
const uploadDir = path.join('uploads', 'name-corrections');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

<<<<<<< HEAD
// ✅ Login route
router.post('/login', loginStudent);        // POST /api/students/login
router.get('/', getAllStudents);  // GET /api/students
router.get('/with-lab-status', getStudentsWithLabStatus);


=======
// 📁 Multer storage for name correction documents
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// ✅ Routes
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.get('/', getAllStudents);
router.get('/:id', getStudentById);

// ✅ Name Correction Flow
router.get('/eligibility/name-correction', getEligibleForNameCorrection);
router.post('/request-name-correction-toggle', markNameCorrectionRequest);
router.post('/upload-correction-doc', upload.single('document'), uploadCorrectionFile);
>>>>>>> master

export default router;
