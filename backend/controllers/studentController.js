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
import Appointment from "../models/appointment.js"
import { generateStudentUserId } from "../utils/idGenerator.js"
import { getFacultyByProgram, programDurations } from "../utils/programInfo.js"
import { notifyStudent } from "../services/notificationService.js"
import { findExaminationOfficer, logApprovalAction } from "../utils/findExaminationOfficer.js"

const generateStudentClass = (program, yearOfAdmission, index) => {
  const programCode = program.substring(0, 2).toUpperCase()
  const yearCode = yearOfAdmission.toString().slice(-2)
  const studentNumber = (index + 1).toString().padStart(2, "0")
  return `${programCode}${yearCode}${studentNumber}`
}

export const registerStudent = async (req, res) => {
  try {
    const { fullName, email, program, yearOfAdmission, phone, motherName, gender, mode, status } = req.body

    const rawPassword = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    const studentId = await generateStudentUserId(program, yearOfAdmission)

    const faculty = getFacultyByProgram(program)
    const duration = programDurations[program] || 4
    const yearOfGraduation = yearOfAdmission + duration

    const index = await Student.countDocuments({ program, yearOfAdmission })
    const studentClass = generateStudentClass(program, yearOfAdmission, index)

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

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

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

export const markNameCorrectionRequest = async (req, res) => {
  const { studentId, requested } = req.body

  try {
    const student = await Student.findOne({ studentId })

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    const mongoId = student._id

    const clearance = await Clearance.findOne({ studentId: mongoId })

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

    if (clearance.finance.status !== "Approved") {
      return res.status(403).json({
        message: "Graduation fee not paid. Please complete payment first.",
      })
    }

    const hasFailed = await CourseRecord.exists({ studentId: mongoId, passed: false })

    if (hasFailed) {
      return res.status(403).json({
        message: "You have failed courses. Complete re-exams before proceeding to examination.",
        blockAccess: true,
      })
    }

    if (student.nameCorrectionStatus && student.nameCorrectionStatus !== "Rejected") {
      return res.status(400).json({
        message: `Name correction already ${student.nameCorrectionStatus.toLowerCase()}. Cannot change decision.`,
        currentStatus: student.nameCorrectionStatus,
      })
    }

    if (requested === false) {
      console.log(`Student ${student.studentId} chose NO name correction - Auto-approving...`)

      await Student.findOneAndUpdate(
        { studentId },
        {
          nameCorrectionRequested: false,
          nameCorrectionStatus: "Declined",
          nameCorrectionEligible: true,
          rejectionReason: "",
        },
      )

      const officerInfo = await findExaminationOfficer()

      if (!officerInfo.officer) {
        return res.status(500).json({
          message: "No examination officer available. Please contact administration.",
          error: officerInfo.error,
        })
      }

      logApprovalAction(student.studentId, "Auto-approve examination (No name correction)", officerInfo, "automatic")

      const exam = await Examination.findOne({ studentId: mongoId })

      if (!exam) {
        return res.status(404).json({ message: "Examination record not found." })
      }

      const now = new Date()
      exam.clearanceStatus = "Approved"
      exam.clearedAt = now
      exam.finalDecisionBy = officerInfo.officer._id
      exam.approvalType = "automatic"
      await exam.save()

      await Clearance.updateOne(
        { studentId: mongoId },
        {
          $set: {
            "examination.status": "Approved",
            "examination.clearedAt": now,
            finalStatus: "Cleared",
          },
        },
      )

      const existingAppointment = await Appointment.findOne({ studentId: mongoId })
      let appointmentDate = new Date()

      if (!existingAppointment) {
        appointmentDate.setDate(appointmentDate.getDate() + 3)

        await Appointment.create({
          studentId: mongoId,
          appointmentDate,
          createdBy: officerInfo.officer._id,
          createdAt: new Date(),
        })

        console.log(`Appointment created for student ${student.studentId} on ${appointmentDate.toDateString()}`)
      } else {
        appointmentDate = existingAppointment.appointmentDate
      }

      try {
        await notifyStudent({
          student,
          title: "Examination Approved",
          message: `Your examination has been approved automatically! Your appointment is scheduled for ${appointmentDate.toDateString()}. No name correction needed.`,
          type: "examination-approved",
        })
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError)
      }

      if (global._io) {
        global._io.emit("examinationAutoApproved", {
          studentId: student.studentId,
          fullName: student.fullName,
          appointmentDate,
          approvalType: "automatic",
          approvedBy: officerInfo.officer.fullName,
          approvalSource: officerInfo.source,
          message: "Examination approved automatically - No name correction needed",
        })
      }

      return res.status(200).json({
        message: "Examination approved automatically! No name correction needed.",
        status: "Declined",
        examinationApproved: true,
        appointmentScheduled: true,
        appointmentDate,
        approvedBy: officerInfo.officer.fullName,
        approvalType: "automatic",
        approvalSource: officerInfo.source,
      })
    }

    if (requested === true) {
      console.log(`Student ${student.studentId} chose YES name correction - Waiting for document...`)

      await Student.findOneAndUpdate(
        { studentId },
        {
          nameCorrectionRequested: true,
          nameCorrectionStatus: "Pending",
          nameCorrectionEligible: true,
          rejectionReason: "",
        },
      )

      if (global._io) {
        global._io.emit("nameCorrectionRequested", {
          studentId: student.studentId,
          fullName: student.fullName,
          status: "Pending",
        })

        global._io.emit("nameCorrection:new-pending", {
          studentId: student.studentId,
          fullName: student.fullName,
          status: "Pending",
          timestamp: new Date(),
        })
      }

      return res.status(200).json({
        message: "Name correction request accepted. Please upload your supporting document.",
        status: "Pending",
        requiresDocument: true,
        nextStep: "Upload passport or certificate document",
      })
    }

    return res.status(400).json({
      message: "Invalid request. Please specify true or false for name correction.",
    })
  } catch (err) {
    console.error("Name correction request error:", err)
    res.status(500).json({ message: "Failed to process request", error: err.message })
  }
}

export const uploadCorrectionFile = async (req, res) => {
  const { studentId, requestedName } = req.body
  const file = req.file

  console.log("[UPLOAD REQUEST RECEIVED]")
  console.log("Headers:", req.headers["content-type"])
  console.log("Body Fields:", req.body)
  console.log("File:", file)

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" })
  }

  try {
    const student = await Student.findOne({ studentId })

    if (!student) {
      console.log("Student not found for ID:", studentId)
      return res.status(404).json({ message: "Student not found" })
    }

    if (student.nameCorrectionStatus !== "Pending" && student.nameCorrectionStatus !== "Rejected") {
      return res.status(400).json({
        message: "You must first request name correction before uploading documents.",
      })
    }

    if (!requestedName || requestedName.trim() === "") {
      return res.status(400).json({
        message: "Requested name is required.",
      })
    }

    const documentPath = file.path.replace(/\\/g, "/")

    await Student.findOneAndUpdate(
      { studentId },
      {
        correctionUploadUrl: documentPath,
        requestedName: requestedName.trim(),
        nameCorrectionStatus: "Document Uploaded",
        nameVerified: false,
      },
    )

    await Examination.findOneAndUpdate(
      { studentId: student._id },
      {
        nameCorrectionDoc: documentPath,
        "requiredDocs.passportUploaded": true,
      },
    )

    if (global._io) {
      global._io.emit("nameCorrectionDocumentUploaded", {
        studentId: student.studentId,
        fullName: student.fullName,
        requestedName: requestedName.trim(),
        documentPath,
      })
    }

    console.log(`Upload Success for ${student.studentId}: ${documentPath}`)

    res.status(200).json({
      message: "Document uploaded successfully.",
      documentPath,
      status: "Document Uploaded",
    })
  } catch (err) {
    console.error("Unexpected upload error:", err.message)
    res.status(500).json({ message: "Failed to upload document", error: err.message })
  }
}

export const getNameCorrectionStatus = async (req, res) => {
  const { studentId } = req.params

  try {
    const student = await Student.findById(studentId).select(
      "nameCorrectionRequested nameCorrectionStatus requestedName nameVerified rejectionReason correctionUploadUrl",
    )

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

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
    console.error("Status check error:", err)
    res.status(500).json({ message: "Failed to get status", error: err.message })
  }
}

export const approveNameCorrection = async (req, res) => {
  const { studentId } = req.params

  try {
    const student = await Student.findById(studentId)

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    if (!student.correctionUploadUrl) {
      return res.status(400).json({ message: "No document uploaded" })
    }

    await Student.findByIdAndUpdate(studentId, {
      nameVerified: true,
      sentToAdmission: false,
    })

    res.status(200).json({ message: "Name correction approved and verified" })
  } catch (err) {
    res.status(500).json({ message: "Approval failed", error: err.message })
  }
}

export const rejectNameCorrection = async (req, res) => {
  const { studentId } = req.params

  try {
    const student = await Student.findById(studentId)

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    await Student.findByIdAndUpdate(studentId, {
      nameCorrectionRequested: false,
      requestedName: "",
      correctionUploadUrl: "",
      nameVerified: false,
      sentToAdmission: false,
    })

    res.status(200).json({ message: "Name correction request rejected and cleared" })
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

    res.status(200).json({ message: "Name correction forwarded to Admission Office" })
  } catch (err) {
    res.status(500).json({ message: "Forwarding failed", error: err.message })
  }
}

export const saveFcmToken = async (req, res) => {
  const studentId = req.user._id
  const { fcmToken } = req.body

  try {
    await Student.findByIdAndUpdate(studentId, { fcmToken })
    res.status(200).json({ message: "FCM token saved." })
  } catch (err) {
    res.status(500).json({ error: "Failed to save FCM token." })
  }
}

export const getMyStudentProfile = async (req, res) => {
  try {
    // 🔍 Find the logged-in student by ID from JWT (req.user._id)
    const student = await Student.findById(req.user._id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 📅 Calculate how many years the student has been enrolled
    const currentYear = new Date().getFullYear();
    const duration = currentYear - (student.yearOfAdmission || currentYear);

    // ✅ Return student data + computed duration
    return res.status(200).json({
      ...student.toObject(), // safer than _doc for newer Mongoose
      duration,
    });
  } catch (error) {
    console.error('❌ Error fetching student profile:', error);
    return res.status(500).json({
      message: 'Failed to fetch student profile',
      error: error.message,
    });
  }
};
