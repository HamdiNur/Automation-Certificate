import express from 'express';
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
  uploadCorrectionFile,
  approveNameCorrection,
  rejectNameCorrection,
  forwardToAdmission
} from '../controllers/studentController.js';

const router = express.Router();

// ✅ Save FCM Token from mobile
router.post('/fcm-token/:studentId', async (req, res) => {
  const { token } = req.body;
  const { studentId } = req.params;

  try {
    await Student.findByIdAndUpdate(studentId, { fcmToken: token });
    res.status(200).json({ message: 'Token saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save token', error: err.message });
  }
});



// 🗂️ Ensure upload folder exists
const uploadDir = path.join('uploads', 'name-corrections');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

// ✅ Name Correction Admin Routes (for admin use)
router.put('/approve-name/:studentId', approveNameCorrection);
router.put('/reject-name/:studentId', rejectNameCorrection);
router.put('/forward-name/:studentId', forwardToAdmission);


export default router;
