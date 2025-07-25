import User from "../models/User.js"

/**
 * ✅ BEST PRACTICE: Hierarchical Fallback System for Finding Examination Officer
 *
 * Priority 1: Designated Default Officer (isDefaultExamOfficer: true)
 * Priority 2: Any Active Exam Officer (role: "exam_office", isActive: true)
 * Priority 3: System Admin (role: "admin", isActive: true)
 * Priority 4: Graceful Failure (return null)
 */
export const findExaminationOfficer = async () => {
  try {
    console.log("🔍 Looking for examination officer using hierarchical fallback...")

    // ✅ Priority 1: Look for designated default examination officer
    let officer = await User.findOne({
      role: "exam_office",
      isDefaultExamOfficer: true,
      isActive: true,
    })

    if (officer) {
      console.log(`✅ Found default examination officer: ${officer.fullName} (${officer.userId})`)
      return {
        officer,
        source: "default",
        message: `Default examination officer: ${officer.fullName}`,
      }
    }

    console.log("⚠️ No default examination officer found, checking for any active exam officer...")

    // ✅ Priority 2: Look for any active examination officer
    officer = await User.findOne({
      role: "exam_office",
      isActive: true,
    }).sort({ lastLogin: -1 }) // Prefer most recently active

    if (officer) {
      console.log(`✅ Found active examination officer: ${officer.fullName} (${officer.userId})`)
      return {
        officer,
        source: "fallback_exam",
        message: `Active examination officer: ${officer.fullName}`,
      }
    }

    console.log("⚠️ No examination officers found, checking for system admin...")

    // ✅ Priority 3: Look for system admin as final fallback
    officer = await User.findOne({
      role: "admin",
      isActive: true,
    }).sort({ lastLogin: -1 })

    if (officer) {
      console.log(`✅ Using admin as fallback: ${officer.fullName} (${officer.userId})`)
      return {
        officer,
        source: "admin_fallback",
        message: `System admin (fallback): ${officer.fullName}`,
      }
    }

    // ✅ Priority 4: No suitable officer found
    console.error("❌ No examination officer or admin found in the system!")
    return {
      officer: null,
      source: "none",
      message: "No examination officer available",
      error: "CRITICAL: No examination officer or admin found in system",
    }
  } catch (error) {
    console.error("❌ Error finding examination officer:", error)
    return {
      officer: null,
      source: "error",
      message: "Error finding examination officer",
      error: error.message,
    }
  }
}

/**
 * ✅ Helper function to log approval actions for audit trail
 */
export const logApprovalAction = (studentId, action, officerInfo, approvalType = "manual") => {
  console.log(`📋 APPROVAL LOG:`)
  console.log(`   Student: ${studentId}`)
  console.log(`   Action: ${action}`)
  console.log(`   Officer: ${officerInfo.officer?.fullName || "System"}`)
  console.log(`   Source: ${officerInfo.source}`)
  console.log(`   Type: ${approvalType}`)
  console.log(`   Timestamp: ${new Date().toISOString()}`)
}
