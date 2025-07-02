import Examination from "../models/examination.js"
import Clearance from "../models/clearance.js"
import CourseRecord from "../models/course.js"
import Student from "../models/Student.js"
import Appointment from "../models/appointment.js"

// 🔹 Get all pending examination records
export const getPendingExamination = async (req, res) => {
  try {
    // ✅ Find students who completed Phase 1 and paid graduation fee
    const students = await Clearance.find({
      "faculty.status": "Approved",
      "library.status": "Approved",
      "lab.status": "Approved",
      "finance.status": "Approved",
    }).populate("studentId")

    // Get only student IDs
    const eligibleIds = students.map((clr) => clr.studentId?._id).filter(Boolean)

    // ✅ Find examination records for those students with "Pending" status
    const pending = await Examination.find({
      studentId: { $in: eligibleIds },
      clearanceStatus: "Pending",
    }).populate("studentId")

    res.status(200).json(pending)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending examinations", error: err.message })
  }
}

// ✅ UPDATED: Complete Name Correction Approval (by examination officer)
export const approveNameCorrection = async (req, res) => {
  const { studentId } = req.body

  try {
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: "Student not found" })

    // ✅ Validate that student has uploaded document
    if (!student.correctionUploadUrl || student.nameCorrectionStatus !== "Document Uploaded") {
      return res.status(400).json({
        message: "No document uploaded or invalid status for approval",
        currentStatus: student.nameCorrectionStatus,
      })
    }

    // ✅ Validate requested name exists
    if (!student.requestedName || student.requestedName.trim() === "") {
      return res.status(400).json({
        message: "No requested name found. Student must specify the new name.",
      })
    }

    console.log(`✅ Officer approving name correction for student ${student.studentId}`)
    console.log(`📝 Changing name from: "${student.fullName}" to: "${student.requestedName}"`)

    // ✅ 1. Update student record - APPROVE NAME CORRECTION
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        fullName: student.requestedName, // ✅ Update actual name
        nameVerified: true,
        nameCorrectionStatus: "Approved", // ✅ Set status to approved
        requestedName: "", // Clear requested name (no longer needed)
        rejectionReason: "", // Clear any previous rejection reason
      },
      { new: true },
    )

    // ✅ 2. Update examination record
    await Examination.findOneAndUpdate({ studentId }, { nameConfirmed: true })

    // ✅ 3. AUTO-APPROVE EXAMINATION (since name correction is done)
    const exam = await Examination.findOne({ studentId })
    if (exam) {
      const now = new Date()

      // Update examination record
      exam.clearanceStatus = "Approved"
      exam.clearedAt = now
      exam.finalDecisionBy = "Examination Officer"
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

      // ✅ 4. CREATE APPOINTMENT AUTOMATICALLY
      const existingAppointment = await Appointment.findOne({ studentId })
      if (!existingAppointment) {
        const appointmentDate = new Date()
        appointmentDate.setDate(appointmentDate.getDate() + 3) // 3 days from now

        await Appointment.create({
          studentId,
          appointmentDate,
          createdBy: "Examination Officer",
          createdAt: new Date(),
        })

        console.log(`📅 Appointment created for student ${student.studentId} on ${appointmentDate}`)
      }

      // ✅ 5. Emit socket events for real-time updates
      if (global._io) {
        global._io.emit("nameCorrectionApproved", {
          studentId: student.studentId,
          fullName: updatedStudent.fullName, // New name
          oldName: student.fullName, // Original name
          newName: updatedStudent.fullName,
          examinationApproved: true,
          appointmentScheduled: true,
        })

        global._io.emit("examinationApproved", {
          studentId: student.studentId,
          fullName: updatedStudent.fullName,
          approvedBy: "Examination Officer",
          reason: "Name correction approved",
        })
      }

      return res.status(200).json({
        message: "✅ Name correction approved! Student name updated and examination cleared.",
        oldName: student.fullName,
        newName: updatedStudent.fullName,
        examinationApproved: true,
        appointmentScheduled: true,
        appointmentDate: new Date(),
      })
    } else {
      return res.status(404).json({
        message: "Examination record not found. Please contact administration.",
      })
    }
  } catch (err) {
    console.error("❌ Name correction approval error:", err)
    res.status(500).json({ message: "Failed to approve name correction", error: err.message })
  }
}

// ✅ UPDATED: Complete Name Correction Rejection (by examination officer)
export const rejectNameCorrection = async (req, res) => {
  const { studentId } = req.params
  const { rejectionReason } = req.body

  try {
    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // ✅ Validate that student has a name correction request
    if (!student.nameCorrectionRequested || student.nameCorrectionStatus === "Declined") {
      return res.status(400).json({
        message: "No active name correction request found",
        currentStatus: student.nameCorrectionStatus,
      })
    }

    // ✅ Validate rejection reason is provided
    if (!rejectionReason || rejectionReason.trim() === "") {
      return res.status(400).json({
        message: "Rejection reason is required. Please provide a clear reason for rejection.",
      })
    }

    // ✅ Validate minimum reason length
    if (rejectionReason.trim().length < 10) {
      return res.status(400).json({
        message: "Rejection reason must be at least 10 characters long.",
      })
    }

    console.log(`❌ Officer rejecting name correction for student ${student.studentId}`)
    console.log(`📝 Rejection reason: ${rejectionReason}`)

    // ✅ Update student record - REJECT NAME CORRECTION
    await Student.findByIdAndUpdate(studentId, {
      nameCorrectionStatus: "Rejected", // ✅ Set status to rejected
      nameVerified: false,
      rejectionReason: rejectionReason.trim(),
      // ✅ Keep uploaded document and requested name for potential re-submission
      // Don't clear: correctionUploadUrl, requestedName
    })

    // ✅ Emit socket event for real-time updates (for future notifications)
    if (global._io) {
      global._io.emit("nameCorrectionRejected", {
        studentId: student.studentId,
        fullName: student.fullName,
        rejectionReason: rejectionReason.trim(),
        canResubmit: true,
      })
    }

    // ✅ TODO: Send FCM notification here (when you implement notifications)
    // await sendNameCorrectionRejectionNotification(student.fcmToken, rejectionReason);

    return res.status(200).json({
      message: "❌ Name correction rejected successfully.",
      rejectionReason: rejectionReason.trim(),
      canResubmit: true,
      nextStep: "Student can upload a new document to resubmit the request",
    })
  } catch (err) {
    console.error("❌ Name correction rejection error:", err)
    res.status(500).json({ message: "Failed to reject name correction", error: err.message })
  }
}

// ✅ UPDATED: Get Name Correction Requests - ALL STATES (Including Approved/Rejected)
export const getNameCorrectionRequests = async (req, res) => {
  try {
    // ✅ Find students in ALL states (including approved/rejected for audit trail)
    const studentsWithRequests = await Student.find({
      nameCorrectionRequested: true, // Must have chosen "Yes"
      nameCorrectionStatus: {
        $in: ["Pending", "Document Uploaded", "Approved", "Rejected"], // ✅ ALL STATES
      },
    }).select(
      "studentId fullName requestedName correctionUploadUrl nameCorrectionStatus createdAt updatedAt rejectionReason",
    )

    const formattedRequests = studentsWithRequests.map((student) => {
      // ✅ Calculate waiting time based on status
      let waitingTime
      if (student.nameCorrectionStatus === "Pending") {
        // Time since they chose "Yes" (waiting for document)
        waitingTime = Math.floor((new Date() - student.updatedAt) / (1000 * 60 * 60 * 24))
      } else if (student.nameCorrectionStatus === "Document Uploaded") {
        // Time since they uploaded document (waiting for review)
        waitingTime = Math.floor((new Date() - student.updatedAt) / (1000 * 60 * 60 * 24))
      } else {
        // Time since approval/rejection
        waitingTime = Math.floor((new Date() - student.updatedAt) / (1000 * 60 * 60 * 24))
      }

      return {
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        requestedName: student.requestedName,
        documentUrl: student.correctionUploadUrl,
        status: student.nameCorrectionStatus,
        rejectionReason: student.rejectionReason || null, // ✅ Include rejection reason
        uploadedAt: student.nameCorrectionStatus === "Document Uploaded" ? student.updatedAt : null,
        processedAt: ["Approved", "Rejected"].includes(student.nameCorrectionStatus) ? student.updatedAt : null, // ✅ When it was processed
        waitingTime: waitingTime,
        // ✅ Action indicators
        actionNeeded:
          student.nameCorrectionStatus === "Pending"
            ? "Document Upload"
            : student.nameCorrectionStatus === "Document Uploaded"
              ? "Officer Review"
              : student.nameCorrectionStatus === "Approved"
                ? "Completed"
                : student.nameCorrectionStatus === "Rejected"
                  ? "Rejected"
                  : "Unknown",
        canTakeAction: student.nameCorrectionStatus === "Document Uploaded", // Only reviewable if document uploaded
        isCompleted: ["Approved", "Rejected"].includes(student.nameCorrectionStatus), // ✅ Completed requests
      }
    })

    // ✅ Sort by priority:
    // 1. Document Uploaded (needs action)
    // 2. Pending (waiting for document)
    // 3. Approved/Rejected (completed, for reference)
    const sortedRequests = formattedRequests.sort((a, b) => {
      // Priority order: Document Uploaded > Pending > Approved/Rejected
      const priorityOrder = {
        "Document Uploaded": 1,
        Pending: 2,
        Approved: 3,
        Rejected: 3,
      }

      const aPriority = priorityOrder[a.status] || 4
      const bPriority = priorityOrder[b.status] || 4

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // Within same priority, sort by waiting time (longest first)
      return b.waitingTime - a.waitingTime
    })

    res.status(200).json({
      count: sortedRequests.length,
      requests: sortedRequests,
      // ✅ UPDATED: Breakdown by status
      breakdown: {
        waitingForDocument: formattedRequests.filter((r) => r.status === "Pending").length,
        readyForReview: formattedRequests.filter((r) => r.status === "Document Uploaded").length,
        approved: formattedRequests.filter((r) => r.status === "Approved").length, // ✅ NEW
        rejected: formattedRequests.filter((r) => r.status === "Rejected").length, // ✅ NEW
      },
    })
  } catch (err) {
    console.error("❌ Error fetching name correction requests:", err)
    res.status(500).json({ message: "Failed to fetch name correction requests", error: err.message })
  }
}

// ✅ UPDATED: Manual Examination Approval (for cases without name correction)
export const approveExamination = async (req, res) => {
  const { studentId, approvedBy } = req.body

  try {
    const exam = await Examination.findOne({ studentId })
    const student = await Student.findById(studentId)

    if (!exam || !student) {
      return res.status(404).json({ message: "Examination or student record not found." })
    }

    // Check if student passed all courses
    const courseRecords = await CourseRecord.find({ studentId })
    const hasPassedAll = courseRecords.every((c) => c.passed)

    if (!hasPassedAll || !exam.canGraduate) {
      return res.status(400).json({ message: "Student has not met graduation criteria." })
    }

    // ✅ Check name correction status
    if (student.nameCorrectionRequested === null || student.nameCorrectionRequested === undefined) {
      return res.status(400).json({
        message: "Student must first decide on name correction before examination approval.",
      })
    }

    // ✅ If name correction was requested but not completed
    if (
      student.nameCorrectionRequested === true &&
      student.nameCorrectionStatus !== "Approved" &&
      student.nameCorrectionStatus !== "Declined"
    ) {
      return res.status(400).json({
        message: `Name correction is ${student.nameCorrectionStatus}. Complete name correction process first.`,
        nameCorrectionStatus: student.nameCorrectionStatus,
      })
    }

    // ✅ Update exam clearance
    const now = new Date()
    exam.clearanceStatus = "Approved"
    exam.clearedAt = now
    exam.finalDecisionBy = approvedBy || "Examination Officer"
    await exam.save()

    // ✅ Update clearance record
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

    // ✅ Create appointment (if not exists)
    const existing = await Appointment.findOne({ studentId })
    if (!existing) {
      const appointmentDate = new Date()
      appointmentDate.setDate(appointmentDate.getDate() + 3)

      await Appointment.create({
        studentId,
        appointmentDate,
        createdBy: approvedBy || "Examination Officer",
      })
    }

    res.status(200).json({
      message: "✅ Examination approved successfully and appointment scheduled.",
    })
  } catch (err) {
    res.status(500).json({
      message: "❌ Failed to approve examination.",
      error: err.message,
    })
  }
}

// ✅ Keep all your existing functions
export const rejectExamination = async (req, res) => {
  const { studentId, remarks } = req.body

  try {
    const exam = await Examination.findOne({ studentId })
    if (!exam) return res.status(404).json({ message: "Examination record not found." })

    exam.clearanceStatus = "Rejected"
    exam.remarks = remarks
    exam.clearedAt = null
    await exam.save()

    await Clearance.updateOne({ studentId }, { $set: { "examination.status": "Rejected" } })

    res.status(200).json({ message: "Examination rejected." })
  } catch (err) {
    res.status(500).json({ message: "Failed to reject examination.", error: err.message })
  }
}

export const confirmStudentName = async (req, res) => {
  const { studentId, newName } = req.body

  try {
    await Student.findByIdAndUpdate(studentId, { fullName: newName })
    await Examination.findOneAndUpdate({ studentId }, { nameConfirmed: true })

    res.status(200).json({ message: "Name updated and confirmed." })
  } catch (err) {
    res.status(500).json({ message: "Name confirmation failed.", error: err.message })
  }
}

export const uploadCertificate = async (req, res) => {
  const { studentId, confirmationPdfUrl } = req.body

  try {
    const exam = await Examination.findOne({ studentId })
    if (!exam) return res.status(404).json({ message: "Examination record not found." })

    exam.confirmationPdfUrl = confirmationPdfUrl
    await exam.save()

    res.status(200).json({ message: "Certificate uploaded." })
  } catch (err) {
    res.status(500).json({ message: "Failed to upload certificate.", error: err.message })
  }
}

export const getFailedCourses = async (req, res) => {
  const { studentId } = req.params

  try {
    const failed = await CourseRecord.find({ studentId, passed: false })
    res.status(200).json(failed)
  } catch (err) {
    res.status(500).json({ message: "Failed to get re-exam courses", error: err.message })
  }
}

export const requestNameCorrection = async (req, res) => {
  const { studentId, requestedName } = req.body

  try {
    const exam = await Examination.findOne({ studentId })
    if (!exam) return res.status(404).json({ message: "Examination record not found" })

    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: "Student not found" })

    if (!student.nameCorrectionRequested) {
      return res.status(403).json({
        message: "❌ You must first confirm your name correction request.",
      })
    }

    const isMajorCorrection = student.fullName.split(" ")[0] !== requestedName?.split(" ")[0]

    exam.nameCorrectionDoc = "Pending"
    exam.forwardedToAdmission = isMajorCorrection
    exam.forwardedReason = isMajorCorrection
      ? "Major name change requested. Forwarded to Admission Office for verification."
      : null

    await exam.save()

    res.status(200).json({
      message: isMajorCorrection
        ? "Your request was forwarded to the Admission Office."
        : "Name correction request recorded.",
      forwarded: isMajorCorrection,
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to update request", error: err.message })
  }
}

export const uploadNameCorrectionDoc = async (req, res) => {
  const { studentId, requestedName } = req.body
  const file = req.file

  if (!file) return res.status(400).json({ message: "No file uploaded" })

  try {
    const exam = await Examination.findOne({ studentId })
    if (!exam) return res.status(404).json({ message: "Examination record not found" })

    exam.nameCorrectionDoc = file.path
    exam.requiredDocs.passportUploaded = true
    await exam.save()

    await Student.findByIdAndUpdate(studentId, {
      requestedName,
    })

    res.status(200).json({
      message: "Document uploaded successfully",
      path: file.path,
    })
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message })
  }
}

export const getFullyClearedStudents = async (req, res) => {
  try {
    const cleared = await Clearance.find({
      "faculty.status": "Approved",
      "library.status": "Approved",
      "lab.status": "Approved",
      "finance.status": "Approved",
    }).populate("studentId", "fullName studentId program email")

    res.status(200).json(cleared)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cleared students", error: err.message })
  }
}

export const getExaminationStats = async (req, res) => {
  try {
    const eligibleStudents = await Clearance.find({
      "faculty.status": "Approved",
      "library.status": "Approved",
      "lab.status": "Approved",
      "finance.status": "Approved",
    })

    const eligibleIds = eligibleStudents.map((c) => c.studentId).filter(Boolean)

    const existingExamRecords = await Examination.find({
      studentId: { $in: eligibleIds },
    })

    const existingIds = existingExamRecords.map((e) => e.studentId.toString())
    const needingExamRecords = eligibleIds.filter((id) => !existingIds.includes(id.toString())).length

    const truePending = await Examination.countDocuments({
      clearanceStatus: "Pending",
    })

    // ✅ Updated: Count ALL name correction states (for dashboard stats)
    const nameCorrections = await Student.countDocuments({
      nameCorrectionRequested: true,
      nameCorrectionStatus: { $in: ["Pending", "Document Uploaded"] }, // Only active ones for dashboard
    })

    const approved = await Examination.countDocuments({
      clearanceStatus: "Approved",
    })

    res.status(200).json({
      pending: truePending,
      needingExamRecords,
      nameCorrections, // Active name corrections (for dashboard)
      approved,
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch examination stats", error: err.message })
  }
}

export const getPassFailSummary = async (req, res) => {
  try {
    const courseSummary = await CourseRecord.aggregate([
      {
        $group: {
          _id: "$studentId",
          failedCourses: {
            $sum: {
              $cond: [{ $eq: ["$passed", false] }, 1, 0],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          passedCount: {
            $sum: {
              $cond: [{ $eq: ["$failedCourses", 0] }, 1, 0],
            },
          },
          failedCount: {
            $sum: {
              $cond: [{ $gt: ["$failedCourses", 0] }, 1, 0],
            },
          },
        },
      },
    ])

    const { passedCount = 0, failedCount = 0 } = courseSummary[0] || {}
    res.status(200).json({ passed: passedCount, failed: failedCount })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pass/fail summary", error: err.message })
  }
}

export const revalidateGraduationEligibility = async (req, res) => {
  const { studentId } = req.body

  try {
    const exam = await Examination.findOne({ studentId })
    if (!exam) return res.status(404).json({ message: "Examination record not found." })

    const failed = await CourseRecord.exists({ studentId, passed: false })
    const passedAll = !failed

    const financeApproved = await Clearance.findOne({
      studentId,
      "finance.status": "Approved",
    })

    const canGraduate = passedAll && !!financeApproved

    exam.hasPassedAllCourses = passedAll
    exam.canGraduate = canGraduate
    await exam.save()

    res.status(200).json({
      message: "Graduation eligibility revalidated",
      hasPassedAllCourses: passedAll,
      canGraduate,
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to revalidate eligibility.", error: err.message })
  }
}

export const getEligibleStudentsSummary = async (req, res) => {
  try {
    const eligibleStudents = await Examination.find({
      clearanceStatus: "Pending",
      canGraduate: { $in: [true, false] },
    }).populate({
      path: "studentId",
      select: "fullName studentId program email",
    })

    const filtered = eligibleStudents.filter((e) => e.studentId)
    const total = filtered.length
    const passed = filtered.filter((e) => e.hasPassedAllCourses).length
    const eligibleToGraduate = filtered.filter((e) => e.canGraduate).length
    const notEligible = total - eligibleToGraduate

    res.status(200).json({
      total,
      passedAllCourses: passed,
      canGraduate: eligibleToGraduate,
      notEligible,
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch eligibility summary", error: err.message })
  }
}

export const checkCertificateEligibility = async (req, res) => {
  const { studentId } = req.params

  try {
    const exam = await Examination.findOne({ studentId })
    const clearance = await Clearance.findOne({ studentId })

    if (!exam || !clearance) {
      return res.status(404).json({ message: "Examination or Clearance record not found" })
    }

    const clearedPhase1 =
      clearance.faculty.status === "Approved" &&
      clearance.lab.status === "Approved" &&
      clearance.library.status === "Approved"

    const clearedPhase2 = clearance.finance.status === "Approved"

    if (!clearedPhase1 || !clearedPhase2) {
      return res.status(200).json({
        canProceed: false,
        message: "Please complete all clearance stages.",
      })
    }

    if (!exam.hasPassedAllCourses) {
      return res.status(200).json({
        canProceed: false,
        failedCourses: true,
        showNameCorrectionOption: false,
        message: "You failed some courses. Re-exam is required.",
      })
    }

    return res.status(200).json({
      canProceed: true,
      failedCourses: false,
      showNameCorrectionOption: true,
      message: "You are eligible for certificate issuance. Do you need a name correction?",
    })
  } catch (error) {
    return res.status(500).json({
      message: "Internal error",
      error: error.message,
    })
  }
}

export const createMissingExaminationRecords = async (req, res) => {
  try {
    const eligibleStudents = await Clearance.find({
      "faculty.status": "Approved",
      "library.status": "Approved",
      "lab.status": "Approved",
      "finance.status": "Approved",
    }).populate("studentId")

    const eligibleIds = eligibleStudents.map((c) => c.studentId?._id).filter(Boolean)

    const existingExamRecords = await Examination.find({
      studentId: { $in: eligibleIds },
    })

    const existingIds = existingExamRecords.map((e) => e.studentId.toString())
    const needingRecords = eligibleIds.filter((id) => !existingIds.includes(id.toString()))

    let created = 0

    for (const studentId of needingRecords) {
      const failed = await CourseRecord.exists({ studentId, passed: false })
      const hasPassedAllCourses = !failed

      await Examination.create({
        studentId,
        hasPassedAllCourses,
        canGraduate: hasPassedAllCourses,
        clearanceStatus: "Pending",
        createdAt: new Date(),
      })

      created++
    }

    res.status(200).json({
      message: `✅ Created ${created} missing examination records`,
      created,
      total: needingRecords.length,
    })
  } catch (err) {
    res.status(500).json({
      message: "Failed to create missing examination records",
      error: err.message,
    })
  }
}

// ✅ NEW FUNCTION: Get all cleared students
export const getClearedStudents = async (req, res) => {
  try {
    // ✅ Find all examination records with "Approved" status
    const clearedExaminations = await Examination.find({
      clearanceStatus: "Approved",
    })
      .populate({
        path: "studentId",
        select:
          "studentId fullName motherName gender program faculty yearOfAdmission yearOfGraduation email phone studentClass mode nameCorrectionRequested nameCorrectionStatus requestedName rejectionReason nameVerified",
      })
      .sort({ clearedAt: -1 }) // Most recent first

    // ✅ Filter out any records without student data
    const validClearedStudents = clearedExaminations.filter((exam) => exam.studentId)

    // ✅ Format the response with additional details
    const formattedStudents = validClearedStudents.map((exam) => ({
      _id: exam._id,
      studentId: exam.studentId,
      hasPassedAllCourses: exam.hasPassedAllCourses,
      canGraduate: exam.canGraduate,
      clearanceStatus: exam.clearanceStatus,
      clearedAt: exam.clearedAt,
      finalDecisionBy: exam.finalDecisionBy,
      nameConfirmed: exam.nameConfirmed,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    }))

    res.status(200).json(formattedStudents)
  } catch (err) {
    console.error("❌ Error fetching cleared students:", err)
    res.status(500).json({
      message: "Failed to fetch cleared students",
      error: err.message,
    })
  }
}

// // Get all name correction requests with student + document
// export const getNameCorrectionRequests = async (req, res) => {
//   try {
//     const corrections = await Examination.find({
//       nameCorrectionDoc: { $exists: true, $ne: null }
//     }).populate("studentId");

//     const result = corrections.map((e) => ({
//       studentId: e.studentId?.studentId || "N/A",
//       fullName: e.studentId?.fullName || "N/A",
//       requestedName: e.studentId?.requestedName || "N/A",
//       correctionUploadUrl: e.nameCorrectionDoc || "",
//       nameVerified: e.studentId?.nameVerified || false,
//       _id: e.studentId?._id
//     }));

//     res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch correction requests", error: err.message });
//   }
// };
