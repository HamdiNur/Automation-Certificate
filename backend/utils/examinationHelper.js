import Clearance from "../models/clearance.js"
import Finance from "../models/finance.js"
import Examination from "../models/examination.js"
import CourseRecord from "../models/course.js"

export const checkAndCreateExaminationRecord = async (studentId) => {
  try {
    // 1. Check Phase 1 clearance (Faculty + Library + Lab)
    const clearance = await Clearance.findOne({ studentId })
    const phase1Complete =
      clearance?.faculty?.status === "Approved" &&
      clearance?.library?.status === "Approved" &&
      clearance?.lab?.status === "Approved"

    if (!phase1Complete) {
      console.log(`Phase 1 not complete for student ${studentId}`)
      return { created: false, reason: "Phase 1 not complete" }
    }

    // 2. Check Finance status - FIXED LOGIC
    const gradCharge = await Finance.findOne({
      studentId,
      type: "Charge",
      description: { $regex: /Graduation Fee/i },
    })

    if (!gradCharge) {
      console.log(`No graduation fee charge found for student ${studentId}`)
      return { created: false, reason: "No graduation fee charge" }
    }

    const payments = await Finance.find({
      studentId,
      type: "Payment",
      description: { $regex: /Graduation Fee/i },
      status: "Approved",
    })

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    // 🔥 FIXED: Consider paid if remaining ≤ $0.01
    const remaining = gradCharge.amount - totalPaid
    const financeApproved = remaining <= 0.01

    console.log(
      `💰 Finance check for ${studentId}: Charge=$${gradCharge.amount}, Paid=$${totalPaid}, Remaining=$${remaining.toFixed(2)}, Approved=${financeApproved}`,
    )

    if (!financeApproved) {
      console.log(`Finance not approved for student ${studentId}`)
      return { created: false, reason: "Finance not approved" }
    }

    // 3. Both conditions met - create/update examination record
    const existingExam = await Examination.findOne({ studentId })
    if (existingExam) {
      console.log(`Examination record already exists for student ${studentId}`)
      return { created: false, reason: "Examination record already exists" }
    }

    // Check course completion
    const failed = await CourseRecord.exists({ studentId, passed: false })
    const hasPassedAllCourses = !failed

    // Create examination record with "Pending" status
    const examRecord = await Examination.create({
      studentId,
      hasPassedAllCourses,
      canGraduate: hasPassedAllCourses,
      clearanceStatus: "Pending",
      createdAt: new Date(),
    })

    console.log(`✅ Examination record created for student ${studentId}`)
    return {
      created: true,
      examRecord,
      reason: "Both Phase 1 and Finance approved",
    }
  } catch (error) {
    console.error(`❌ Error checking examination eligibility for student ${studentId}:`, error)
    return { created: false, reason: "Error occurred", error: error.message }
  }
}
