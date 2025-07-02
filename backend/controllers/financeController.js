
// 📁 controllers/financeController.js
import axios from 'axios';
import Finance from '../models/finance.js';
import Student from '../models/Student.js';
import Clearance from '../models/clearance.js';
import Examination from '../models/examination.js'; // also ensure this is present
import CourseRecord from '../models/course.js';
import { revalidateGraduationEligibility } from './examinationController.js'; // adjust path if needed
import { checkAndCreateExaminationRecord } from "../utils/examinationHelper.js"
// ✅ controllers/financeController.js
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

    const canGraduate = gradCharge && totalGradPaid >= gradCharge.amount

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
export const getPendingFinance = async (req, res) => {
  try {
    const pendingCharges = await Finance.find({
      type: "Charge",
      description: { $regex: /Graduation Fee/i },
      status: "Pending",
    }).populate("studentId", "fullName studentId")

    const results = []

    for (const charge of pendingCharges) {
      // 🔥 REMOVED: Lab clearance check for testing
      // const clearance = await Clearance.findOne({ studentId: charge.studentId._id })
      // const labCleared = clearance?.lab?.status === "Approved"
      // if (!labCleared) continue // Skip if Lab not cleared yet

      const payments = await Finance.find({
        studentId: charge.studentId._id,
        status: "Approved",
        type: "Payment",
        description: { $regex: /Graduation Fee/i },
      })

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      const remaining = charge.amount - totalPaid

      if (remaining > 0.001) {
        results.push({
          _id: charge._id,
          studentId: charge.studentId?.studentId,
          fullName: charge.studentId?.fullName,
          semester: charge.semester,
          description: charge.description,
          amount: remaining.toFixed(2),
          type: charge.type,
          status: charge.status,
          createdAt: charge.createdAt,
          labCleared: true, // Always true for testing
        })
      }
    }

    res.status(200).json(results)
  } catch (err) {
    console.error("❌ Error fetching pending payments:", err)
    res.status(500).json({ message: "Error fetching pending payments", error: err.message })
  }
}


// Keep existing functions...
// ✅ FIXED: Correct sAtats calculation
export const getFinanceStats = async (req, res) => {
  try {
    // Get students who FULLY paid graduation fee (not just partial payments)
    const gradCharges = await Finance.find({
      type: "Charge",
      description: { $regex: /Graduation Fee/i },
    }).populate("studentId", "studentId fullName")

    let fullyPaidCount = 0
    let pendingCount = 0

    for (const charge of gradCharges) {
      const payments = await Finance.find({
        studentId: charge.studentId._id,
        type: "Payment",
        description: { $regex: /Graduation Fee/i },
        status: "Approved",
      })

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      const remaining = charge.amount - totalPaid

      // 🔥 FIXED: Only count as "paid" if FULLY paid
      if (remaining <= 0.001) {
        fullyPaidCount++ // Actually paid the full amount
      } else {
        pendingCount++ // Still owes money (like $0.01)
      }
    }

    const totalCollected = await Finance.aggregate([
      { $match: { type: "Payment", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    res.status(200).json({
      graduationFeePaid: fullyPaidCount, // 🔥 FIXED: Only fully paid students
      pendingPayments: pendingCount, // 🔥 FIXED: Students who still owe money
      totalCollected: totalCollected[0]?.total || 0,
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch finance stats", error: err.message })
  }
}

export const adminForceApproveFinance = async (req, res) => {
  const { studentId, approvedBy = 'Finance Officer' } = req.body;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const hasPending = await Finance.exists({ studentId: student._id, status: 'Pending' });
    if (!hasPending) {
      return res.status(400).json({ message: 'No pending finance records to approve' });
    }

    await Finance.updateMany(
      { studentId: student._id, status: 'Pending' },
      {
        $set: {
          status: 'Approved',
          approvedBy,
          clearedAt: new Date()
        }
      }
    );

    // 💡 Optional: Only add payment if not already paid
    const existingPayment = await Finance.findOne({
      studentId: student._id,
      type: 'Payment',
      description: { $regex: /Graduation Fee/i },
      status: 'Approved'
    });

    if (!existingPayment) {
      await Finance.create({
        studentId: student._id,
        semester: 8,
        type: 'Payment',
        description: 'Graduation Fee Payment (Manual Override)',
        amount: 300,
        paymentMethod: 'Manual Override',
        receiptNumber: `OVERRIDE-${Date.now()}`,
        status: 'Approved',
        balanceAfter: 0,
        createdAt: new Date()
      });
    }

    await Clearance.updateOne(
      { studentId: student._id },
      {
        $set: {
          'finance.status': 'Approved',
          'finance.clearedAt': new Date()
        }
      }
    );

    const failed = await CourseRecord.exists({ studentId: student._id, passed: false });
    const hasPassedAllCourses = !failed;

    const existingExam = await Examination.findOne({ studentId: student._id });

    if (!existingExam) {
      await Examination.create({
        studentId: student._id,
        hasPassedAllCourses,
        canGraduate: hasPassedAllCourses,
        clearanceStatus: 'Pending'
      });
    } else {
      existingExam.hasPassedAllCourses = hasPassedAllCourses;
      existingExam.canGraduate = hasPassedAllCourses;
      await existingExam.save();
    }

    await revalidateGraduationEligibility(
      { body: { studentId: student._id.toString() } },
      { status: () => ({ json: () => {} }) }
    );

    return res.status(200).json({
      message: '✅ Finance override successful, payment added if needed, exam clearance triggered.'
    });

  } catch (err) {
    console.error('❌ Manual finance approval failed:', err);
    return res.status(500).json({ message: 'Manual finance approval failed', error: err.message });
  }
};



export const rejectFinance = async (req, res) => {
  const { studentId, remarks } = req.body;

  try {
    const student = await Student.findOne({ studentId });
    await Finance.updateMany(
      { studentId: student._id, status: 'Pending' },
      {
        $set: {
          status: 'Rejected',
          remarks
        }
      }
    );

    await Clearance.updateOne(
      { studentId: student._id },
      { $set: { 'finance.status': 'Rejected' } }
    );

    res.status(200).json({ message: 'Finance records rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Finance rejection failed', error: err.message });
  }
};


export const adminAddManualPayment = async (req, res) => {
  const { studentId, newPaymentAmount, method = 'Cash' } = req.body;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Optional: Prevent duplicate manual grad fee payments
    const existing = await Finance.findOne({
      studentId: student._id,
      type: 'Payment',
      description: { $regex: /Graduation Fee/i },
      status: 'Approved'
    });
    if (existing) {
      return res.status(400).json({ message: "Graduation payment already recorded" });
    }

    // ✅ Dynamically calculate balance
    const records = await Finance.find({ studentId: student._id, status: 'Approved' });
    let balance = 0;
    for (const r of records) {
      if (r.type === 'Charge') balance += r.amount;
      if (r.type === 'Payment') balance -= r.amount;
    }
    const updatedBalance = balance - newPaymentAmount;

    const payment = new Finance({
      studentId: student._id,
      semester: 0,
      type: 'Payment',
      description: `Student Paid $${newPaymentAmount} manually`,
      amount: newPaymentAmount,
      paymentMethod: method,
      receiptNumber: `MANUAL-${Date.now()}`,
      status: 'Approved',
      balanceAfter: updatedBalance
    });

    await payment.save();

    res.status(200).json({
      message: 'Manual payment recorded successfully',
      receipt: {
        studentId: student.studentId,
        amount: payment.amount,
        method: payment.paymentMethod,
        receiptNumber: payment.receiptNumber,
        balanceAfter: updatedBalance
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record payment', error: err.message });
  }
};

export const getStudentsWhoPaidGraduationFee = async (req, res) => {
  try {
    // ✅ Find students who completed graduation fee payment ($250.00)
    const studentsWithGradCharge = await Finance.find({
      type: "Charge",
      description: { $regex: /Graduation Fee/i },
    }).populate("studentId", "studentId fullName")

    const fullyPaidStudents = []

    for (const chargeRecord of studentsWithGradCharge) {
      const student = chargeRecord.studentId
      if (!student) continue

      // Get all graduation fee payments for this student
      const payments = await Finance.find({
        studentId: student._id,
        type: "Payment",
        description: { $regex: /Graduation Fee/i },
        status: "Approved",
      })

      const totalPaid = payments.reduce((sum, r) => sum + r.amount, 0)

      // ✅ Only include students who paid EXACTLY $250.00 (completed payment)
      if (totalPaid >= 250) {
        // Find the latest Waafi payment (non-TEST receipt)
        const waafiPayments = payments.filter((p) => p.receiptNumber && !p.receiptNumber.startsWith("TEST-"))

        // Get the latest payment (Waafi or TEST, whichever is latest)
        const latestPayment = payments.sort((a, b) => b.createdAt - a.createdAt)[0]

        // Prefer Waafi receipt if available, otherwise use latest
        const displayReceipt =
          waafiPayments.length > 0
            ? waafiPayments.sort((a, b) => b.createdAt - a.createdAt)[0].receiptNumber
            : latestPayment.receiptNumber

        fullyPaidStudents.push({
          studentId: student.studentId,
          fullName: student.fullName,
          amount: totalPaid, // This will be $250.00
          receipt: displayReceipt || "-",
          paidAt: latestPayment.createdAt.toISOString().split("T")[0],
        })
      }
    }

    res.status(200).json(fullyPaidStudents)
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch graduation payments",
      error: err.message,
    })
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


export const processStudentPayment = async (req, res) => {
  try {
    // ✅ FIXED: Accept both flexible payments AND graduation fee logic
    const { studentId, amount, description } = req.body
    const student = await Student.findOne({ studentId })

    if (!student) return res.status(404).json({ message: "Student not found" })

    const accountNo = student.phone
    if (!/^25261\d{7}$/.test(accountNo)) {
      return res.status(400).json({ message: "Invalid EVC-compatible phone number" })
    }

    let finalAmount, finalDescription

    // ✅ FIXED: Support both manual payments and graduation fee payments
    if (amount && description) {
      // Manual payment (like your original code)
      finalAmount = Number.parseFloat(amount)
      finalDescription = description
    } else {
      // Graduation fee payment (new logic)
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

    // ✅ FIXED: Use the working payload structure from your original code
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
        payerInfo: {
          accountNo, // ✅ Same structure as working code
        },
        transactionInfo: {
          referenceId: `REF-${Date.now()}`, // ✅ Same as working code
          invoiceId: `INV-${Date.now()}`, // ✅ Same as working code
          amount: finalAmount, // ✅ Use parseFloat like working code
          currency: "USD",
          description: finalDescription,
        },
      },
    }

    console.log("💳 Processing Waafi payment...")
    console.log("📱 Phone:", accountNo)
    console.log("💰 Amount:", finalAmount)
    console.log("📝 Description:", finalDescription)

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

    // ✅ FIXED: Calculate balance like your working code
    const financeRecords = await Finance.find({ studentId: student._id, status: "Approved" })
    const totalCharges = financeRecords
      .filter((r) => r.type === "Charge")
      .reduce((sum, r) => sum + Number.parseFloat(r.amount), 0)
    const totalPayments = financeRecords
      .filter((r) => r.type === "Payment")
      .reduce((sum, r) => sum + Number.parseFloat(r.amount), 0)
    const updatedBalance = Number.parseFloat((totalCharges - totalPayments - finalAmount).toFixed(2))

    // ✅ Create payment record
    await Finance.create({
      studentId: student._id,
      semester: 8,
      type: "Payment",
      description: finalDescription,
      amount: finalAmount,
      paymentMethod: "EVC Plus",
      receiptNumber: resData?.params?.transactionId || `WAAFI-${Date.now()}`,
      status: "Approved",
      balanceAfter: updatedBalance, // ✅ Use calculated balance
      createdAt: new Date(),
    })

    // ✅ Update clearance finance status
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

    // ✅ Check if examination record should be created (only for graduation fees)
    let examResult = { created: false, reason: "Regular payment" }
    if (finalDescription.includes("Graduation Fee")) {
      examResult = await checkAndCreateExaminationRecord(student._id)
    }

    let message = "✅ Payment successful!"
    if (examResult.created) {
      message += " Examination record created - you can now proceed to examination phase."
    }

    // ✅ FIXED: Use the working socket events from your original code
    if (global._io) {
      if (examResult.created) {
        global._io.emit("examination:new-eligible", {
          studentId: student.studentId,
          fullName: student.fullName,
          canGraduate: examResult.examRecord?.canGraduate,
          timestamp: new Date(),
        })
      }

      // ✅ Use the original working socket event name
      global._io.emit("finance:cleared", {
        studentId: student.studentId,
        fullName: student.fullName,
        clearedAt: new Date(),
      })
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
