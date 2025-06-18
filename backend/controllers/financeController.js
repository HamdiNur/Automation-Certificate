
// 📁 controllers/financeController.js
import axios from 'axios';
import Finance from '../models/finance.js';
import Student from '../models/Student.js';
import Clearance from '../models/clearance.js';
import Examination from '../models/examination.js'; // also ensure this is present
import CourseRecord from '../models/course.js';
import { revalidateGraduationEligibility } from './examinationController.js'; // adjust path if needed

// ✅ controllers/financeController.js
export const getStudentFinanceSummary = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findOne({ studentId }).select('fullName studentId _id');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const records = await Finance.find({ studentId: student._id }).sort({ createdAt: 1 });

    if (!records.length) {
      return res.status(404).json({ message: "No finance records found" });
    }

    let totalCharges = 0;
    let totalPaid = 0;

    const transactions = records.map(rec => {
      if (rec.type === 'Charge') totalCharges += rec.amount;
      if (rec.type === 'Payment') totalPaid += rec.amount;

      return {
        semester: rec.semester,
        date: rec.createdAt.toISOString().split('T')[0],
        type: rec.type,
        description: rec.description,
        amount: `$${rec.amount.toFixed(2)}`,
        paymentMethod: rec.paymentMethod || '-',
        receiptNumber: rec.receiptNumber || '-',
        balanceAfter: `$${rec.balanceAfter?.toFixed(2) ?? '0.00'}`
      };
    });

    const balance = totalCharges - totalPaid;

    // ✅ Graduation eligibility check
    const gradCharge = records.find(r =>
      r.type === 'Charge' && r.description?.toLowerCase().includes('graduation fee')
    );

    const gradPayments = records
      .filter(r => r.type === 'Payment' && r.description?.toLowerCase().includes('graduation fee'));

    const totalGradPaid = gradPayments.reduce((sum, r) => sum + r.amount, 0);

    const canGraduate = gradCharge && totalGradPaid >= gradCharge.amount;

    res.status(200).json({
      student: {
        studentId: student.studentId,
        fullName: student.fullName
      },
      summary: {
        totalCharges: totalCharges.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        balance: balance.toFixed(2),
        canGraduate
      },
      transactions
    });

  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch finance summary', error: err.message });
  }
};

export const getPendingFinance = async (req, res) => {
  try {
    const pendingCharges = await Finance.find({
      status: 'Pending',
      type: 'Charge',
      description: { $regex: /Graduation Fee/i }
    }).populate('studentId', 'fullName studentId');

    const results = [];

    for (const charge of pendingCharges) {
      const payments = await Finance.find({
        studentId: charge.studentId._id,
        status: 'Approved',
        type: 'Payment',
        description: { $regex: /Graduation Fee/i }
      });

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = charge.amount - totalPaid;

      // ✅ Only push to results if there's an unpaid amount
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
          createdAt: charge.createdAt
        });
      } else {
        // ✅ Mark charge as approved if fully paid
        await Finance.findByIdAndUpdate(charge._id, {
          $set: { status: 'Approved', approvedBy: 'System', clearedAt: new Date() }
        });
      }
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending finance records', error: err.message });
  }
};


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
    const studentsWithGradCharge = await Finance.find({
      type: 'Charge',
      description: { $regex: /Graduation Fee/i },
    }).populate('studentId', 'studentId fullName');

    const uniqueStudentMap = new Map();

    for (const chargeRecord of studentsWithGradCharge) {
      const student = chargeRecord.studentId;
      if (!student) continue;

      const studentId = student._id.toString();

      // Prevent re-checking if already processed
      if (uniqueStudentMap.has(studentId)) continue;

      const [charges, payments] = await Promise.all([
        Finance.find({
          studentId: student._id,
          type: 'Charge',
          description: { $regex: /Graduation Fee/i },
          status: 'Approved',
        }),
        Finance.find({
          studentId: student._id,
          type: 'Payment',
          description: { $regex: /Graduation Fee/i },
          status: 'Approved',
        }),
      ]);

      const totalCharge = charges.reduce((sum, r) => sum + r.amount, 0);
      const totalPaid = payments.reduce((sum, r) => sum + r.amount, 0);

      // Only include if fully paid
      if (totalPaid >= totalCharge && totalCharge !== 0) {
        // Pick latest payment info
        const latestPayment = payments.sort((a, b) => b.createdAt - a.createdAt)[0];

        uniqueStudentMap.set(studentId, {
          studentId: student.studentId,
          fullName: student.fullName,
          amount: totalPaid,
          receipt: latestPayment.receiptNumber || '-',
          paidAt: latestPayment.createdAt.toISOString().split('T')[0],
        });
      }
    }

    res.status(200).json([...uniqueStudentMap.values()]);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch graduation payments',
      error: err.message,
    });
  }
};


export const getFinanceStats = async (req, res) => {
  try {
    // Get ALL students who paid graduation fee
    const payments = await Finance.find({
      type: 'Payment',
      status: 'Approved',
      description: { $regex: /Graduation Fee/i }
    }).populate('studentId', 'studentId fullName');

    const graduatedStudents = [];

    for (const p of payments) {
      const allRecords = await Finance.find({ studentId: p.studentId._id });

      let totalCharges = 0;
      let totalPaid = 0;

      for (const r of allRecords) {
        if (r.type === 'Charge') totalCharges += r.amount;
        if (r.type === 'Payment') totalPaid += r.amount;
      }

      const balance = totalCharges - totalPaid;

      if (totalCharges === totalPaid && totalCharges !== 0) {
        graduatedStudents.push(p.studentId._id); // count this student
      }
    }

    const graduationFeePaid = graduatedStudents.length;

    const pendingPayments = await Finance.countDocuments({ status: 'Pending' });

    const totalPaid = await Finance.aggregate([
      { $match: { type: 'Payment', status: 'Approved' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.status(200).json({
      graduationFeePaid,
      pendingPayments,
      totalCollected: totalPaid[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch finance stats", error: err.message });
  }
};



export const processStudentPayment = async (req, res) => {
  try {
    const { studentId, amount, description } = req.body;

    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const accountNo = student.phone;
    if (!/^25261\d{7}$/.test(accountNo)) {
      return res.status(400).json({ message: "Invalid EVC-compatible phone number" });
    }

    // 🔐 Prepare Payload for WaafiPay
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
          accountNo
        },
        transactionInfo: {
          referenceId: `REF-${Date.now()}`,
          invoiceId: `INV-${Date.now()}`,
          amount: parseFloat(amount),  // Ensure it's not string
          currency: "USD",
          description
        }
      }
    };

    // 📡 Send request to Waafi
    const response = await axios.post(process.env.PAYMENT_API_URL, payload);
    const resData = response.data;

    // ✅ Accept if state is APPROVED or responseCode is success
    const isApproved = resData?.params?.state === "APPROVED";
    const isSuccessCode = ["00", "2001", "RCS_SUCCESS"].includes(resData?.responseCode);

    if (!isApproved && !isSuccessCode) {
      return res.status(400).json({
        message: "❌ Payment failed or rejected by user.",
        detail: resData
      });
    }

    // 🧾 Fetch past finance records to compute updated balance
    const financeRecords = await Finance.find({ studentId: student._id, status: "Approved" });

    const totalCharges = financeRecords
      .filter(r => r.type === "Charge")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    const totalPayments = financeRecords
      .filter(r => r.type === "Payment")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    const updatedBalance = parseFloat((totalCharges - totalPayments - parseFloat(amount)).toFixed(2));

    // 💾 Save this Payment
    await Finance.create({
      studentId: student._id,
      semester: 8,
      type: "Payment",
      description,
      amount: parseFloat(amount),
      paymentMethod: "EVC Plus",
      receiptNumber: resData?.params?.transactionId || `TXN-${Date.now()}`,
      status: "Approved",
      balanceAfter: updatedBalance,
      createdAt: new Date()
    });

    // ✅ Update Finance Clearance
    await Clearance.updateOne(
      { studentId: student._id },
      {
        $set: {
          "finance.status": "Approved",
          "finance.clearedAt": new Date()
        }
      },
      { upsert: true }
    );

    // 🎓 Update Exam Clearance & Eligibility
    const failed = await CourseRecord.exists({ studentId: student._id, passed: false });
    const hasPassedAllCourses = !failed;

    await Examination.findOneAndUpdate(
      { studentId: student._id },
      {
        hasPassedAllCourses,
        canGraduate: hasPassedAllCourses,
        clearanceStatus: "Pending"
      },
      { upsert: true }
    );
    if (global._io) {
  // Emit exam eligibility
  global._io.emit("examination:new-eligible", {
    studentId: student.studentId,
    fullName: student.fullName,
    canGraduate: hasPassedAllCourses,
    timestamp: new Date()
  });

  // ✅ Emit finance clearance (THIS IS WHAT THE FRONTEND LISTENS TO!)
  global._io.emit("finance:cleared", {
    studentId: student.studentId,
    fullName: student.fullName,
    clearedAt: new Date()
  });
}


  // 🟢 NEW: Notify finance dashboard
  

    // 🔁 Revalidate Graduation
    await revalidateGraduationEligibility(
      { body: { studentId: student._id.toString() } },
      { status: () => ({ json: () => {} }) }
    );

    return res.status(200).json({
      message: "✅ Payment successful, student cleared in finance.",
      transactionId: resData?.params?.transactionId || null,
      balanceAfter: updatedBalance
    });

  } catch (err) {
    console.error("❌ Payment Error:", err.message);
    return res.status(500).json({
      message: "Server error during payment processing",
      error: err.message
    });
  }
};
