import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import {
  getPendingExamination,
  approveExamination,
  rejectExamination,
  uploadCertificate,
  confirmStudentName,
  getFailedCourses,
  requestNameCorrection,
  uploadNameCorrectionDoc,
  getFullyClearedStudents,
  getExaminationStats,
  getPassFailSummary,
  revalidateGraduationEligibility,
  getEligibleStudentsSummary,
  checkCertificateEligibility,
  approveNameCorrection,
  // getNameCorrectionRequests
} from '../controllers/examinationController.js';

const router = express.Router();

// 📁 Ensure the folder exists
const uploadDir = path.join('uploads', 'verify-docs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🗂️ Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// ✅ Main routes
router.get('/pending', getPendingExamination);
router.post('/approved', approveExamination);
router.post('/reject', rejectExamination);
router.post('/upload-certificate', uploadCertificate);
router.post('/revalidate-eligibility', revalidateGraduationEligibility);

router.post('/confirm-name', confirmStudentName);
router.get('/eligibility-summary', getEligibleStudentsSummary);

router.get('/reexam/:studentId', getFailedCourses);
router.get('/cleared-students', getFullyClearedStudents);
router.get("/pass-fail-summary", getPassFailSummary);

router.get("/stats", getExaminationStats);

// 🆕 Name Correction Uploads
// router.get('/name-corrections', getNameCorrectionRequests); // 👈 ADD THIS

router.post('/request-name-correction', requestNameCorrection);
router.post('/name-correction-approve', approveNameCorrection); // 🆕 Add the route here

router.post('/upload-passport', upload.single('document'), uploadNameCorrectionDoc);
// ✅ Eligibility route for mobile app
router.get('/status/:studentId', checkCertificateEligibility);

export default router;
