import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import Student from "../models/Student.js"
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
  forwardToAdmission,
  getNameCorrectionStatus,
  getMyStudentProfile, // ✅ NEW: Status endpoint for Flutter
} from "../controllers/studentController.js"
import studentAuth from "../middleware/studentAuth.js"

const router = express.Router()

// ✅ Save FCM Token from mobile
router.post("/fcm-token/:studentId", async (req, res) => {
  const { token } = req.body
  const { studentId } = req.params

  try {
    await Student.findByIdAndUpdate(studentId, { fcmToken: token })
    res.status(200).json({ message: "FCM token saved successfully" })
  } catch (err) {
    res.status(500).json({ message: "Failed to save FCM token", error: err.message })
  }
})

// 🗂️ Ensure upload folder exists
const uploadDir = path.join("uploads", "name-corrections")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 📁 Multer storage for name correction documents
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
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

// ✅ Basic Student Routes
router.post("/register", registerStudent)
router.post("/login", loginStudent)
router.get("/", getAllStudents)
router.get('/me', studentAuth, getMyStudentProfile); // ✅ added
router.get("/:id", getStudentById)

// ✅ Name Correction Eligibility
router.get("/eligibility/name-correction", getEligibleForNameCorrection)

// ✅ MAIN NAME CORRECTION FLOW (Used by Flutter)
// 1. Check status and eligibility
router.get("/name-correction-status/:studentId", getNameCorrectionStatus)

// 2. Student makes choice (Yes/No)
router.post("/request-name-correction-toggle", markNameCorrectionRequest)

// 3. Student uploads document (if chose Yes)
router.post("/upload-correction-doc", upload.single("document"), uploadCorrectionFile)

// ✅ ADMIN ROUTES (Used by examination officers - keeping for backward compatibility)
router.put("/approve-name/:studentId", approveNameCorrection)
router.put("/reject-name/:studentId", rejectNameCorrection)
router.put("/forward-name/:studentId", forwardToAdmission)

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
