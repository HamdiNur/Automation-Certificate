// 📁 controllers/financeController.js
import axios from "axios"
import Finance from "../models/finance.js"
import Student from "../models/Student.js"
import Clearance from "../models/clearance.js"
import Examination from "../models/examination.js"
import CourseRecord from "../models/course.js"
import { revalidateGraduationEligibility } from "./examinationController.js"
import { checkAndCreateExaminationRecord } from "../utils/examinationHelper.js"

// ✅ OPTIMIZED: Much faster pending finance query
//overall balance, not just graduation fee

export const getPendingFinance = async (req, res) => {
  try {
    // Get all students with finance records - NO PHASE 1 RESTRICTION
    const studentsWithBalance = await Finance.aggregate([
      {
        $group: {
          _id: "$studentId",
          totalCharges: {
            $sum: {
              $cond: [{ $eq: ["$type", "Charge"] }, "$amount", 0],
            },
          },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ["$type", "Payment"] }, "$amount", 0],
            },
          },
        },
      },
      {
        $addFields: {
          balance: { $subtract: ["$totalCharges", "$totalPaid"] },
        },
      },
      {
        $match: {
          balance: { $gt: 0.01 }, // Still owes money
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      // ✅ REMOVED: Phase 1 clearance restriction
      // No more clearance lookup or clearance status matching
      {
        $project: {
          _id: 1,
          studentId: "$student.studentId",
          fullName: "$student.fullName",
          description: {
            $cond: [{ $gte: ["$balance", 200] }, "Graduation Fee - $250", "Outstanding Balance"],
          },
          amount: { $round: ["$balance", 2] },
          type: "Charge",
          status: "Pending",
          createdAt: new Date(),
          semester: 8,
        },
      },
      { $sort: { createdAt: 1 } },
    ])

    res.status(200).json(studentsWithBalance)
  } catch (err) {
    console.error("❌ Error fetching pending payments:", err)
    res.status(500).json({ message: "Error fetching pending payments", error: err.message })
  }
}
// ✅ OPTIMIZED: Much faster stats calculation
export const getFinanceStats = async (req, res) => {
  try {
    const statsResults = await Finance.aggregate([
      {
        $group: {
          _id: "$studentId",
          totalCharges: {
            $sum: {
              $cond: [{ $eq: ["$type", "Charge"] }, "$amount", 0],
            },
          },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ["$type", "Payment"] }, "$amount", 0],
            },
          },
        },
      },
      {
        $addFields: {
          balance: { $subtract: ["$totalCharges", "$totalPaid"] },
          fullyPaid: { $lte: [{ $subtract: ["$totalCharges", "$totalPaid"] }, 0.01] },
        },
      },
      {
        $match: {
          totalPaid: { $gte: 100 }, // Has made substantial payments
        },
      },
      {
        $group: {
          _id: null,
          fullyPaidCount: { $sum: { $cond: ["$fullyPaid", 1, 0] } },
          pendingCount: { $sum: { $cond: ["$fullyPaid", 0, 1] } },
        },
      },
    ])

    const totalCollected = await Finance.aggregate([
      { $match: { type: "Payment", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    const stats = statsResults[0] || { fullyPaidCount: 0, pendingCount: 0 }

    res.status(200).json({
      graduationFeePaid: stats.fullyPaidCount,
      pendingPayments: stats.pendingCount,
      totalCollected: totalCollected[0]?.total || 0,
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch finance stats", error: err.message })
  }
}
// ✅ FIXED: Graduation paid students query
//graduation paid students
export const getStudentsWhoPaidGraduationFee = async (req, res) => {
  try {
    const fullyPaidStudents = await Finance.aggregate([
      {
        $group: {
          _id: "$studentId",
          totalCharges: {
            $sum: {
              $cond: [{ $eq: ["$type", "Charge"] }, "$amount", 0],
            },
          },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ["$type", "Payment"] }, "$amount", 0],
            },
          },
          latestPayment: { $last: "$$ROOT" },
        },
      },
      {
        $addFields: {
          balance: { $subtract: ["$totalCharges", "$totalPaid"] },
        },
      },
      {
        $match: {
          balance: { $lte: 0.01 }, // Fully paid (including $0.01 remaining)
          totalPaid: { $gte: 100 }, // Has made substantial payments
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      // ✅ REMOVED: Phase 1 clearance restriction
      // This was filtering out 2 students who paid but haven't completed Phase 1
      {
        $project: {
          studentId: "$student.studentId",
          fullName: "$student.fullName",
          amount: { $round: ["$totalPaid", 2] },
          receipt: {
            $cond: {
              if: { $ne: ["$latestPayment.receiptNumber", null] },
              then: "$latestPayment.receiptNumber",
              else: "PAID-FULL",
            },
          },
          paidAt: "$latestPayment.createdAt",
        },
      },
      { $sort: { paidAt: -1 } },
    ])

    res.status(200).json(fullyPaidStudents)
  } catch (err) {
    console.error("❌ Error fetching graduation paid students:", err)
    res.status(500).json({
      message: "Failed to fetch graduation payments",
      error: err.message,
    })
  }
}
// ✅ FIXED: Enhanced payment processing with proper socket events
export const processStudentPayment = async (req, res) => {
  try {
    const { studentId, amount, description } = req.body

    const student = await Student.findOne({ studentId })
    if (!student) return res.status(404).json({ message: "Student not found" })

    const accountNo = student.phone
    if (!/^25261\d{7}$/.test(accountNo)) {
      return res.status(400).json({ message: "Invalid EVC-compatible phone number" })
    }

    let finalAmount, finalDescription

    if (amount && description) {
      finalAmount = Number.parseFloat(amount)
      finalDescription = description
    } else {
      const gradCharge = await Finance.findOne({
        studentId: student._id,
        type: "Charge",
        description: { $regex: /Graduation Fee/i },
      })

      if (!gradCharge) {
        return res.status(404).json({ message: "Graduation fee charge not found" })
      }

      const existingPayments = await Finance.find({
        studentId: student._id,
        type: "Payment",
        description: { $regex: /Graduation Fee/i },
        status: "Approved",
      })

      const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0)
      if (totalPaid >= gradCharge.amount) {
        return res.status(400).json({ message: "Graduation fee already paid" })
      }

      finalAmount = gradCharge.amount - totalPaid
      finalDescription = `Graduation Fee Payment - ${student.fullName}`
    }

    const payload = {
      schemaVersion: "1.0",
      requestId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      channelName: "WEB",
      serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid: process.env.MERCHANT_UID,
        apiUserId: process.env.API_USER_ID,
        apiKey: process.env.API_KEY,
        paymentMethod: "mwallet_account",
        payerInfo: { accountNo },
        transactionInfo: {
          referenceId: `REF-${Date.now()}`,
          invoiceId: `INV-${Date.now()}`,
          amount: finalAmount,
          currency: "USD",
          description: finalDescription,
        },
      },
    }

    console.log("💳 Processing Waafi payment...")
    const response = await axios.post(process.env.PAYMENT_API_URL, payload)
    const resData = response.data

    const isApproved = resData?.params?.state === "APPROVED"
    const isSuccessCode = ["00", "2001", "RCS_SUCCESS"].includes(resData?.responseCode)

    if (!isApproved && !isSuccessCode) {
      return res.status(400).json({
        message: "❌ Payment failed or rejected",
        detail: resData,
      })
    }

    // Calculate balance
    const financeRecords = await Finance.find({ studentId: student._id, status: "Approved" })
    const totalCharges = financeRecords
      .filter((r) => r.type === "Charge")
      .reduce((sum, r) => sum + Number.parseFloat(r.amount), 0)
    const totalPayments = financeRecords
      .filter((r) => r.type === "Payment")
      .reduce((sum, r) => sum + Number.parseFloat(r.amount), 0)
    const updatedBalance = Number.parseFloat((totalCharges - totalPayments - finalAmount).toFixed(2))

    // Create payment record
    await Finance.create({
      studentId: student._id,
      semester: 8,
      type: "Payment",
      description: finalDescription,
      amount: finalAmount,
      paymentMethod: "EVC Plus",
      receiptNumber: resData?.params?.transactionId || `WAAFI-${Date.now()}`,
      status: "Approved",
      balanceAfter: updatedBalance,
      createdAt: new Date(),
    })

    // Update clearance
    await Clearance.updateOne(
      { studentId: student._id },
      {
        $set: {
          "finance.status": "Approved",
          "finance.clearedAt": new Date(),
        },
      },
      { upsert: true },
    )

    // Check examination eligibility
    let examResult = { created: false, reason: "Regular payment" }
    if (finalDescription.includes("Graduation Fee")) {
      examResult = await checkAndCreateExaminationRecord(student._id)
    }

    let message = "✅ Payment successful!"
    if (examResult.created) {
      message += " Examination record created - you can now proceed to examination phase."
    }

    // ✅ FIXED: Emit proper socket events
    if (global._io) {
      // Always emit finance cleared event
      global._io.emit("finance:cleared", {
        studentId: student.studentId,
        fullName: student.fullName,
        clearedAt: new Date(),
      })

      // Emit payment completed event
      global._io.emit("finance:payment-completed", {
        studentId: student.studentId,
        fullName: student.fullName,
        amount: finalAmount,
        timestamp: new Date(),
      })

      // Emit examination eligible if applicable
      if (examResult.created) {
        global._io.emit("examination:new-eligible", {
          studentId: student.studentId,
          fullName: student.fullName,
          canGraduate: examResult.examRecord?.canGraduate,
          timestamp: new Date(),
        })
      }
    }

    return res.status(200).json({
      message,
      transactionId: resData?.params?.transactionId,
      amountPaid: finalAmount,
      balanceAfter: updatedBalance,
      receiptNumber: resData?.params?.transactionId || `WAAFI-${Date.now()}`,
      examinationEligible: examResult.created,
    })
  } catch (err) {
    console.error("❌ Payment error:", err)
    return res.status(500).json({
      message: "Payment processing failed",
      error: err.message,
    })
  }
}

// Keep other existing functions...
// 🔥 MAIN FIX: Updated getStudentFinanceSummary with correct graduation logic
export const getStudentFinanceSummary = async (req, res) => {
  const { studentId } = req.params
  try {
    const student = await Student.findOne({ studentId }).select("fullName studentId _id")
    if (!student) return res.status(404).json({ message: "Student not found" })

    const records = await Finance.find({ studentId: student._id }).sort({ createdAt: 1 })

    if (!records.length) {
      return res.status(404).json({ message: "No finance records found" })
    }

    let totalCharges = 0
    let totalPaid = 0

    const transactions = records.map((rec) => {
      if (rec.type === "Charge") totalCharges += rec.amount
      if (rec.type === "Payment") totalPaid += rec.amount

      return {
        semester: rec.semester,
        date: rec.createdAt.toISOString().split("T")[0],
        type: rec.type,
        description: rec.description,
        amount: `$${rec.amount.toFixed(2)}`,
        paymentMethod: rec.paymentMethod || "-",
        receiptNumber: rec.receiptNumber || "-",
        balanceAfter: `$${rec.balanceAfter?.toFixed(2) ?? "0.00"}`,
      }
    })

    const balance = totalCharges - totalPaid

    const gradCharge = records.find(
      (r) => r.type === "Charge" && r.description?.toLowerCase().includes("graduation fee"),
    )

    const gradPayments = records.filter(
      (r) => r.type === "Payment" && r.description?.toLowerCase().includes("graduation fee"),
    )

    const totalGradPaid = gradPayments.reduce((sum, r) => sum + r.amount, 0)

    // 🔥 FIXED: Correct graduation eligibility logic
    let canGraduate = false
    if (gradCharge) {
      const remaining = gradCharge.amount - totalGradPaid
      // ✅ FIXED: Only allow graduation if remaining is $0.00 or less (negative means overpaid)
      canGraduate = remaining <= 0

      console.log(
        `🎓 ${studentId}: Charge=$${gradCharge.amount}, Paid=$${totalGradPaid}, Remaining=$${remaining.toFixed(2)}, CanGraduate=${canGraduate}`,
      )
    }

    res.status(200).json({
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
      },
      summary: {
        totalCharges: totalCharges.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        balance: balance.toFixed(2),
        canGraduate,
      },
      transactions,
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch finance summary", error: err.message })
  }
}
export const adminForceApproveFinance = async (req, res) => {
  const { studentId, approvedBy = "Finance Officer" } = req.body

  try {
    const student = await Student.findOne({ studentId })
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    const hasPending = await Finance.exists({ studentId: student._id, status: "Pending" })
    if (!hasPending) {
      return res.status(400).json({ message: "No pending finance records to approve" })
    }

    await Finance.updateMany(
      { studentId: student._id, status: "Pending" },
      {
        $set: {
          status: "Approved",
          approvedBy,
          clearedAt: new Date(),
        },
      },
    )

    const existingPayment = await Finance.findOne({
      studentId: student._id,
      type: "Payment",
      description: { $regex: /Graduation Fee/i },
      status: "Approved",
    })

    if (!existingPayment) {
      await Finance.create({
        studentId: student._id,
        semester: 8,
        type: "Payment",
        description: "Graduation Fee Payment (Manual Override)",
        amount: 250, // Fixed: Use 250 instead of 300
        paymentMethod: "Manual Override",
        receiptNumber: `OVERRIDE-${Date.now()}`,
        status: "Approved",
        balanceAfter: 0,
        createdAt: new Date(),
      })
    }

    await Clearance.updateOne(
      { studentId: student._id },
      {
        $set: {
          "finance.status": "Approved",
          "finance.clearedAt": new Date(),
        },
      },
    )

    const failed = await CourseRecord.exists({ studentId: student._id, passed: false })
    const hasPassedAllCourses = !failed

    const existingExam = await Examination.findOne({ studentId: student._id })

    if (!existingExam) {
      await Examination.create({
        studentId: student._id,
        hasPassedAllCourses,
        canGraduate: hasPassedAllCourses,
        clearanceStatus: "Pending",
      })
    } else {
      existingExam.hasPassedAllCourses = hasPassedAllCourses
      existingExam.canGraduate = hasPassedAllCourses
      await existingExam.save()
    }

    await revalidateGraduationEligibility(
      { body: { studentId: student._id.toString() } },
      { status: () => ({ json: () => {} }) },
    )

    return res.status(200).json({
      message: "✅ Finance override successful, payment added if needed, exam clearance triggered.",
    })
  } catch (err) {
    console.error("❌ Manual finance approval failed:", err)
    return res.status(500).json({ message: "Manual finance approval failed", error: err.message })
  }
}

export const rejectFinance = async (req, res) => {
  const { studentId, remarks } = req.body

  try {
    const student = await Student.findOne({ studentId })
    await Finance.updateMany(
      { studentId: student._id, status: "Pending" },
      {
        $set: {
          status: "Rejected",
          remarks,
        },
      },
    )

    await Clearance.updateOne({ studentId: student._id }, { $set: { "finance.status": "Rejected" } })

    res.status(200).json({ message: "Finance records rejected" })
  } catch (err) {
    res.status(500).json({ message: "Finance rejection failed", error: err.message })
  }
}

export const adminAddManualPayment = async (req, res) => {
  const { studentId, newPaymentAmount, method = "Cash" } = req.body

  try {
    const student = await Student.findOne({ studentId })
    if (!student) return res.status(404).json({ message: "Student not found" })

    const existing = await Finance.findOne({
      studentId: student._id,
      type: "Payment",
      description: { $regex: /Graduation Fee/i },
      status: "Approved",
    })
    if (existing) {
      return res.status(400).json({ message: "Graduation payment already recorded" })
    }

    const records = await Finance.find({ studentId: student._id, status: "Approved" })
    let balance = 0
    for (const r of records) {
      if (r.type === "Charge") balance += r.amount
      if (r.type === "Payment") balance -= r.amount
    }
    const updatedBalance = balance - newPaymentAmount

    const payment = new Finance({
      studentId: student._id,
      semester: 0,
      type: "Payment",
      description: `Student Paid $${newPaymentAmount} manually`,
      amount: newPaymentAmount,
      paymentMethod: method,
      receiptNumber: `MANUAL-${Date.now()}`,
      status: "Approved",
      balanceAfter: updatedBalance,
    })

    await payment.save()

    res.status(200).json({
      message: "Manual payment recorded successfully",
      receipt: {
        studentId: student.studentId,
        amount: payment.amount,
        method: payment.paymentMethod,
        receiptNumber: payment.receiptNumber,
        balanceAfter: updatedBalance,
      },
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to record payment", error: err.message })
  }
}


// export const getFinanceStats = async (req, res) => {
//   try {
//     // Get ALL students who paid graduation fee
//     const payments = await Finance.find({
//       type: 'Payment',
//       status: 'Approved',
//       description: { $regex: /Graduation Fee/i }
//     }).populate('studentId', 'studentId fullName');

//     const graduatedStudents = [];

//     for (const p of payments) {
//       const allRecords = await Finance.find({ studentId: p.studentId._id });

//       let totalCharges = 0;
//       let totalPaid = 0;

//       for (const r of allRecords) {
//         if (r.type === 'Charge') totalCharges += r.amount;
//         if (r.type === 'Payment') totalPaid += r.amount;
//       }

//       const balance = totalCharges - totalPaid;

//       if (totalCharges === totalPaid && totalCharges !== 0) {
//         graduatedStudents.push(p.studentId._id); // count this student
//       }
//     }

//     const graduationFeePaid = graduatedStudents.length;

//     const pendingPayments = await Finance.countDocuments({ status: 'Pending' });

//     const totalPaid = await Finance.aggregate([
//       { $match: { type: 'Payment', status: 'Approved' } },
//       { $group: { _id: null, total: { $sum: "$amount" } } }
//     ]);

//     res.status(200).json({
//       graduationFeePaid,
//       pendingPayments,
//       totalCollected: totalPaid[0]?.total || 0
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch finance stats", error: err.message });
//   }
// };



//
// export const processStudentPayment = async (req, res) => {
//   try {
//     const { studentId } = req.body

//     const student = await Student.findOne({ studentId })
//     if (!student) return res.status(404).json({ message: "Student not found" })

//     const accountNo = student.phone
//     if (!/^25261\d{7}$/.test(accountNo)) {
//       return res.status(400).json({ message: "Invalid EVC-compatible phone number" })
//     }

//     // 🔥 REMOVED: Lab clearance check for testing
//     // const clearance = await Clearance.findOne({ studentId: student._id })
//     // if (clearance?.lab?.status !== "Approved") {
//     //   return res.status(400).json({ message: "Lab clearance required before payment" })
//     // }

//     const gradCharge = await Finance.findOne({
//       studentId: student._id,
//       type: "Charge",
//       description: { $regex: /Graduation Fee/i },
//     })

//     if (!gradCharge) {
//       return res.status(404).json({ message: "Graduation fee charge not found" })
//     }

//     const existingPayments = await Finance.find({
//       studentId: student._id,
//       type: "Payment",
//       description: { $regex: /Graduation Fee/i },
//       status: "Approved",
//     })

//     const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0)
//     if (totalPaid >= gradCharge.amount) {
//       return res.status(400).json({ message: "Graduation fee already paid" })
//     }

//     const amountToPay = gradCharge.amount - totalPaid

//     const payload = {
//       schemaVersion: "1.0",
//       requestId: Date.now().toString(),
//       timestamp: new Date().toISOString(),
//       channelName: "WEB",
//       serviceName: "API_PURCHASE",
//       serviceParams: {
//         merchantUid: process.env.MERCHANT_UID,
//         apiUserId: process.env.API_USER_ID,
//         apiKey: process.env.API_KEY,
//         paymentMethod: "mwallet_account",
//         payerInfo: { accountNo },
//         transactionInfo: {
//           referenceId: `GRAD-${Date.now()}`,
//           invoiceId: `INV-${Date.now()}`,
//           amount: amountToPay,
//           currency: "USD",
//           description: `Graduation Fee Payment - ${student.fullName}`,
//         },
//       },
//     }

//     console.log("💳 Processing Waafi payment for graduation fee...")
//     const response = await axios.post(process.env.PAYMENT_API_URL, payload)
//     const resData = response.data

//     const isApproved = resData?.params?.state === "APPROVED"
//     const isSuccessCode = ["00", "2001", "RCS_SUCCESS"].includes(resData?.responseCode)

//     if (!isApproved && !isSuccessCode) {
//       return res.status(400).json({
//         message: "❌ Payment failed or rejected",
//         detail: resData,
//       })
//     }

//     await Finance.create({
//       studentId: student._id,
//       semester: 8,
//       type: "Payment",
//       description: `Graduation Fee Payment - $${amountToPay}`,
//       amount: amountToPay,
//       paymentMethod: "EVC Plus (Waafi)",
//       receiptNumber: resData?.params?.transactionId || `WAAFI-${Date.now()}`,
//       status: "Approved",
//       balanceAfter: 0,
//       createdAt: new Date(),
//     })

//     await Clearance.updateOne(
//       { studentId: student._id },
//       {
//         $set: {
//           "finance.status": "Approved",
//           "finance.clearedAt": new Date(),
//         },
//       },
//       { upsert: true },
//     )

//     const failed = await CourseRecord.exists({ studentId: student._id, passed: false })
//     const hasPassedAllCourses = !failed

//     await Examination.findOneAndUpdate(
//       { studentId: student._id },
//       {
//         hasPassedAllCourses,
//         canGraduate: hasPassedAllCourses,
//         clearanceStatus: "Pending",
//       },
//       { upsert: true },
//     )

//     if (global._io) {
//       global._io.emit("examination:new-eligible", {
//         studentId: student.studentId,
//         fullName: student.fullName,
//         canGraduate: hasPassedAllCourses,
//         timestamp: new Date(),
//       })

//       global._io.emit("finance:payment-completed", {
//         studentId: student.studentId,
//         fullName: student.fullName,
//         amount: amountToPay,
//         timestamp: new Date(),
//       })
//     }

//     return res.status(200).json({
//       message: "✅ Payment successful! Proceeding to Examination phase...",
//       transactionId: resData?.params?.transactionId,
//       amountPaid: amountToPay,
//       receiptNumber: resData?.params?.transactionId || `WAAFI-${Date.now()}`,
//       nextStep: "Examination clearance is now available",
//     })
//   } catch (err) {
//     console.error("❌ Graduation fee payment error:", err)
//     return res.status(500).json({
//       message: "Payment processing failed",
//       error: err.message,
//     })
//   }
// }
