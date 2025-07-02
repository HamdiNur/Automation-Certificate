import express from "express"
import multer from "multer"
import fs from "fs"
import path from "path"
import {
  getPendingExamination,
  approveExamination,
  rejectExamination,
  uploadCertificate,
  confirmStudentName,
  getFailedCourses,
  requestNameCorrection,
  uploadNameCorrectionDoc,
  getExaminationStats,
  getPassFailSummary,
  revalidateGraduationEligibility,
  getEligibleStudentsSummary,
  checkCertificateEligibility,
  approveNameCorrection,
  rejectNameCorrection,
  createMissingExaminationRecords,
  getNameCorrectionRequests, // ✅ NEW: Get pending name correction requests
  getClearedStudents, // ✅ NEW: Get cleared students
} from "../controllers/examinationController.js"

const router = express.Router()

// 📁 Ensure the folder exists
const uploadDir = path.join("uploads", "verify-docs")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 🗂️ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs only
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Only image files and PDFs are allowed!"), false)
    }
  },
})

// ✅ MAIN EXAMINATION ROUTES
router.get("/pending", getPendingExamination)
router.post("/approve", approveExamination) // ✅ Fixed route name
router.post("/reject", rejectExamination)
router.post("/upload-certificate", uploadCertificate)
router.post("/revalidate-eligibility", revalidateGraduationEligibility)
router.post("/confirm-name", confirmStudentName)
router.get("/eligibility-summary", getEligibleStudentsSummary)
router.get("/reexam/:studentId", getFailedCourses)
router.get("/cleared-students", getClearedStudents) // ✅ Updated route
router.get("/pass-fail-summary", getPassFailSummary)
router.get("/stats", getExaminationStats)

// ✅ UTILITY ROUTES
router.post("/create-missing-records", createMissingExaminationRecords)

// ✅ ELIGIBILITY CHECK (for Flutter)
router.get("/status/:studentId", checkCertificateEligibility)

// ✅ NAME CORRECTION ROUTES (Officer Actions)
// Get all pending name correction requests for officer dashboard
router.get("/name-correction-requests", getNameCorrectionRequests)

// Officer approves name correction
router.post("/name-correction-approve", approveNameCorrection)

// Officer rejects name correction with reason
router.put("/name-correction-reject/:studentId", rejectNameCorrection)

// ✅ LEGACY NAME CORRECTION ROUTES (keeping for backward compatibility)
router.post("/request-name-correction", requestNameCorrection)
router.post("/upload-passport", upload.single("document"), uploadNameCorrectionDoc)

// ✅ Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Maximum size is 5MB." })
    }
  }
  if (error.message === "Only image files and PDFs are allowed!") {
    return res.status(400).json({ message: "Invalid file type. Only images and PDFs are allowed." })
  }
  next(error)
})

export default router
