import dotenv from "dotenv"
dotenv.config()

import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import Student from "../models/Student.js"
import Group from "../models/group.js"
import CourseRecord from "../models/course.js"
import Clearance from "../models/clearance.js"
import Examination from "../models/examination.js"
import Finance from "../models/finance.js"
import Appointment from "../models/appointment.js" // ✅ Added for appointment creation
import { generateStudentUserId } from "../utils/idGenerator.js"
import { getFacultyByProgram, programDurations } from "../utils/programInfo.js"

// ✅ REGISTER STUDENT
export const registerStudent = async (req, res) => {
  try {
    const { fullName, email, program, yearOfAdmission, phone, motherName, gender, mode, status } = req.body

    // 🔐 Generate password & hash
    const rawPassword = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    // 🆔 Generate student ID
    const studentId = await generateStudentUserId(program, yearOfAdmission)

    // 🏛️ Get academic info
    const faculty = getFacultyByProgram(program)
    const duration = programDurations[program] || 4
    const yearOfGraduation = yearOfAdmission + duration

    // 🏫 Generate student class label (e.g., CA211)
    const index = await Student.countDocuments({ program, yearOfAdmission })
    const studentClass = generateStudentClass(program, yearOfAdmission, index)

    // 📦 Create student
    const newStudent = await Student.create({
      fullName,
      email,
      studentId,
      program,
      faculty,
      yearOfAdmission,
      duration,
      yearOfGraduation,
      studentClass,
      rawPassword,
      hashedPassword,
      phone,
      motherName,
      gender,
      mode,
      status,
    })

    // ✅ Respond
    res.status(201).json({
      message: "Student registered successfully",
      student: {
        studentId: newStudent.studentId,
        fullName: newStudent.fullName,
        gender: newStudent.gender,
        motherName: newStudent.motherName,
        program: newStudent.program,
        faculty: newStudent.faculty,
        yearOfAdmission: newStudent.yearOfAdmission,
        yearOfGraduation: newStudent.yearOfGraduation,
        studentClass: newStudent.studentClass,
        email: newStudent.email,
        phone: newStudent.phone,
        password: newStudent.rawPassword,
        clearanceStatus: newStudent.clearanceStatus,
        profilePicture: newStudent.profilePicture,
        mode: newStudent.mode,
        status: newStudent.status,
      },
    })
  } catch (error) {
    console.error("Register Error:", error.message)
    res.status(500).json({ error: error.message })
  }
}

// ✅ LOGIN STUDENT
export const loginStudent = async (req, res) => {
  const { studentId, password } = req.body

  try {
    const student = await Student.findOne({
      studentId: { $regex: new RegExp(`^${studentId}$`, "i") },
    })

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" })
    }

    const isMatch = await bcrypt.compare(password, student.hashedPassword)

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret not configured" })
    }

    const token = jwt.sign({ id: student._id, studentId: student.studentId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    })

    return res.status(200).json({
      message: "Login successful",
      token,
      student: {
        id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        gender: student.gender,
        motherName: student.motherName,
        program: student.program,
        faculty: student.faculty,
        yearOfAdmission: student.yearOfAdmission,
        yearOfGraduation: student.yearOfGraduation,
        studentClass: student.studentClass,
        email: student.email,
        phone: student.phone,
        clearanceStatus: student.clearanceStatus,
        profilePicture: student.profilePicture,
        mode: student.mode,
        status: student.status,
      },
    })
  } catch (error) {
    console.error("Login Error:", error.message)
    return res.status(500).json({ error: "Server error during login" })
  }
}

export const getAllStudents = async (req, res) => {
  try {
    const query = {}

    if (req.query.nameCorrectionRequested === "true") {
      query.nameCorrectionRequested = true
      query.nameCorrectionEligible = true
    }

    const students = await Student.find(query).select(
      "studentId fullName requestedName correctionUploadUrl nameVerified nameCorrectionStatus",
    )

    res.status(200).json(students)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students", error: err.message })
  }
}

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: "Student not found" })

    res.status(200).json(student)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student", error: err.message })
  }
}

export const getEligibleForNameCorrection = async (req, res) => {
  try {
    const eligibleStudents = []

    const clearedGroups = await Group.find({
      "clearanceProgress.faculty.status": "Approved",
      "clearanceProgress.library.status": "Approved",
      "clearanceProgress.lab.status": "Approved",
    }).populate("members")

    for (const group of clearedGroups) {
      for (const student of group.members) {
        const courses = await CourseRecord.find({ studentId: student._id })
        const failed = courses.some((c) => c.passed === false)

        const charges = await Finance.find({ studentId: student._id, type: "Charge" })
        const pendingCharges = charges.some((f) => f.status === "Pending")

        if (!failed && !pendingCharges) {
          eligibleStudents.push({
            studentId: student.studentId,
            fullName: student.fullName,
            email: student.email,
            groupNumber: group.groupNumber,
          })

          await Student.updateOne({ _id: student._id }, { $set: { nameCorrectionEligible: true } })
        }
      }
    }

    res.status(200).json({ count: eligibleStudents.length, eligibleStudents })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch eligible students", error: err.message })
  }
}

// ✅ UPDATED: Complete Name Correction Request Handler
export const markNameCorrectionRequest = async (req, res) => {
  const { studentId, requested } = req.body

  try {
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: "Student not found" })

    // ✅ 1. Check Prerequisites - Phase 1 Clearance
    const clearance = await Clearance.findOne({ studentId })
    if (
      !clearance ||
      clearance.faculty.status !== "Approved" ||
      clearance.library.status !== "Approved" ||
      clearance.lab.status !== "Approved"
    ) {
      return res.status(403).json({
        message: "Phase 1 clearance not complete. Complete Faculty, Library, and Lab clearance first.",
      })
    }

    // ✅ 2. Check Prerequisites - Finance Approval
    if (clearance.finance.status !== "Approved") {
      return res.status(403).json({
        message: "Graduation fee not paid. Please complete payment first.",
      })
    }

    // ✅ 3. Check Prerequisites - All Courses Passed
    const hasFailed = await CourseRecord.exists({ studentId, passed: false })
    if (hasFailed) {
      return res.status(403).json({
        message: "You have failed courses. Complete re-exams before proceeding to examination.",
        blockAccess: true,
      })
    }

    // ✅ 4. Block if already has a status (prevent duplicate requests)
    if (student.nameCorrectionStatus && student.nameCorrectionStatus !== "Rejected") {
      return res.status(400).json({
        message: `Name correction already ${student.nameCorrectionStatus.toLowerCase()}. Cannot change decision.`,
        currentStatus: student.nameCorrectionStatus,
      })
    }

    // ✅ 5. Handle Student Choice
    if (requested === false) {
      // 🚀 STUDENT CHOSE "NO" - Auto-approve everything
      console.log(`🚀 Student ${student.studentId} chose NO name correction - Auto-approving...`)

      // Update student record
      await Student.findByIdAndUpdate(studentId, {
        nameCorrectionRequested: false,
        nameCorrectionStatus: "Declined",
        nameCorrectionEligible: true,
        rejectionReason: "", // Clear any previous rejection
      })

      // ✅ Auto-approve examination
      const exam = await Examination.findOne({ studentId })
      if (exam) {
        const now = new Date()

        // Update examination record
        exam.clearanceStatus = "Approved"
        exam.clearedAt = now
        exam.finalDecisionBy = "System Auto-Approval"
        await exam.save()

        // Update clearance record
        await Clearance.updateOne(
          { studentId },
          {
            $set: {
              "examination.status": "Approved",
              "examination.clearedAt": now,
              finalStatus: "Cleared",
            },
          },
        )

        // ✅ Create appointment automatically
        const existingAppointment = await Appointment.findOne({ studentId })
        if (!existingAppointment) {
          const appointmentDate = new Date()
          appointmentDate.setDate(appointmentDate.getDate() + 3) // 3 days from now

          await Appointment.create({
            studentId,
            appointmentDate,
            createdBy: "System Auto-Approval",
            createdAt: new Date(),
          })

          console.log(`✅ Appointment created for student ${student.studentId}`)
        }

        // ✅ Emit socket event for real-time updates
        if (global._io) {
          global._io.emit("examinationAutoApproved", {
            studentId: student.studentId,
            fullName: student.fullName,
            appointmentDate: new Date(), // Declared here
            message: "Examination approved automatically - No name correction needed",
          })
        }

        return res.status(200).json({
          message: "✅ Examination approved automatically! No name correction needed.",
          status: "Declined",
          examinationApproved: true,
          appointmentScheduled: true,
          appointmentDate: new Date(), // Declared here
        })
      } else {
        return res.status(404).json({
          message: "Examination record not found. Please contact administration.",
        })
      }
    } else if (requested === true) {
      // 🔄 STUDENT CHOSE "YES" - Set to pending, wait for document
      console.log(`📝 Student ${student.studentId} chose YES name correction - Waiting for document...`)

      await Student.findByIdAndUpdate(studentId, {
        nameCorrectionRequested: true,
        nameCorrectionStatus: "Pending",
        nameCorrectionEligible: true,
        rejectionReason: "", // Clear any previous rejection
      })

      // ✅ Emit socket event
      if (global._io) {
        global._io.emit("nameCorrectionRequested", {
          studentId: student.studentId,
          fullName: student.fullName,
          status: "Pending",
        })
      }

      return res.status(200).json({
        message: "✅ Name correction request accepted. Please upload your supporting document.",
        status: "Pending",
        requiresDocument: true,
        nextStep: "Upload passport or certificate document",
      })
    } else {
      return res.status(400).json({
        message: "Invalid request. Please specify true or false for name correction.",
      })
    }
  } catch (err) {
    console.error("❌ Name correction request error:", err)
    res.status(500).json({ message: "Failed to process request", error: err.message })
  }
}

// ✅ Upload file (passport/school cert) for name correction
export const uploadCorrectionFile = async (req, res) => {
  const { studentId, requestedName } = req.body
  const file = req.file

  if (!file) return res.status(400).json({ message: "No file uploaded" })

  try {
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: "Student not found" })

    // ✅ Check if student has requested name correction
    if (student.nameCorrectionStatus !== "Pending" && student.nameCorrectionStatus !== "Rejected") {
      return res.status(400).json({
        message: "You must first request name correction before uploading documents.",
      })
    }

    // ✅ Validate requested name
    if (!requestedName || requestedName.trim() === "") {
      return res.status(400).json({
        message: "Requested name is required.",
      })
    }

    // ✅ Update student record with document and requested name
    await Student.findByIdAndUpdate(studentId, {
      correctionUploadUrl: file.path,
      requestedName: requestedName.trim(),
      nameCorrectionStatus: "Document Uploaded", // ✅ Status progression
      nameVerified: false,
    })

    // ✅ Update examination record
    await Examination.findOneAndUpdate(
      { studentId },
      {
        nameCorrectionDoc: file.path,
        "requiredDocs.passportUploaded": true,
      },
    )

    // ✅ Emit socket event for real-time updates
    if (global._io) {
      global._io.emit("nameCorrectionDocumentUploaded", {
        studentId: student.studentId,
        fullName: student.fullName,
        requestedName: requestedName.trim(),
        documentPath: file.path,
      })
    }

    console.log(`📄 Document uploaded for student ${student.studentId}: ${file.path}`)

    res.status(200).json({
      message: "✅ Document uploaded successfully. Waiting for examination officer review.",
      status: "Document Uploaded",
      documentPath: file.path,
      requestedName: requestedName.trim(),
      nextStep: "Wait for examination officer to review your document",
    })
  } catch (err) {
    console.error("❌ Document upload error:", err)
    res.status(500).json({ message: "Failed to upload document", error: err.message })
  }
}

// ✅ NEW: Get Name Correction Status (for Flutter)
export const getNameCorrectionStatus = async (req, res) => {
  const { studentId } = req.params

  try {
    const student = await Student.findById(studentId).select(
      "nameCorrectionRequested nameCorrectionStatus requestedName nameVerified rejectionReason correctionUploadUrl",
    )

    if (!student) return res.status(404).json({ message: "Student not found" })

    // ✅ Check eligibility first
    const clearance = await Clearance.findOne({ studentId })
    const hasFailed = await CourseRecord.exists({ studentId, passed: false })

    const isEligible =
      clearance &&
      clearance.faculty.status === "Approved" &&
      clearance.library.status === "Approved" &&
      clearance.lab.status === "Approved" &&
      clearance.finance.status === "Approved" &&
      !hasFailed

    if (!isEligible) {
      return res.status(200).json({
        eligible: false,
        message: hasFailed
          ? "You have failed courses. Complete re-exams first."
          : "Complete all clearance requirements first.",
        blockAccess: !!hasFailed,
      })
    }

    // ✅ Return current status
    res.status(200).json({
      eligible: true,
      nameCorrectionRequested: student.nameCorrectionRequested,
      status: student.nameCorrectionStatus,
      requestedName: student.requestedName,
      nameVerified: student.nameVerified,
      rejectionReason: student.rejectionReason,
      hasDocument: !!student.correctionUploadUrl,
      canChoose: student.nameCorrectionStatus === null || student.nameCorrectionStatus === "Rejected",
      canResubmit: student.nameCorrectionStatus === "Rejected",
    })
  } catch (err) {
    console.error("❌ Status check error:", err)
    res.status(500).json({ message: "Failed to get status", error: err.message })
  }
}

// ✅ Keep existing functions (these are still used by admin)
export const approveNameCorrection = async (req, res) => {
  const { studentId } = req.params

  try {
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: "Student not found" })

    if (!student.correctionUploadUrl) {
      return res.status(400).json({ message: "No document uploaded" })
    }

    await Student.findByIdAndUpdate(studentId, {
      nameVerified: true,
      sentToAdmission: false,
    })

    res.status(200).json({ message: "✅ Name correction approved and verified" })
  } catch (err) {
    res.status(500).json({ message: "Approval failed", error: err.message })
  }
}

export const rejectNameCorrection = async (req, res) => {
  const { studentId } = req.params

  try {
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: "Student not found" })

    await Student.findByIdAndUpdate(studentId, {
      nameCorrectionRequested: false,
      requestedName: "",
      correctionUploadUrl: "",
      nameVerified: false,
      sentToAdmission: false,
    })

    res.status(200).json({ message: "❌ Name correction request rejected and cleared" })
  } catch (err) {
    res.status(500).json({ message: "Rejection failed", error: err.message })
  }
}

export const forwardToAdmission = async (req, res) => {
  const { studentId } = req.params

  try {
    const student = await Student.findById(studentId)
    if (!student || !student.nameVerified) {
      return res.status(400).json({ message: "Student not verified for name change" })
    }

    await Student.findByIdAndUpdate(studentId, {
      sentToAdmission: true,
    })

    res.status(200).json({ message: "📨 Name correction forwarded to Admission Office" })
  } catch (err) {
    res.status(500).json({ message: "Forwarding failed", error: err.message })
  }
}
