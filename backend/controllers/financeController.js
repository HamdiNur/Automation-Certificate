// // 📁 financeController.js
// import Finance from '../models/finance.js';
// import Clearance from '../models/Clearance.js';

// export const getPendingFinance = async (req, res) => {
//   try {
//     const pending = await Finance.find({ status: 'Pending' }).populate('studentId');
//     res.status(200).json(pending);
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching finance.', error: err.message });
//   }
// };

// export const approveFinance = async (req, res) => {
//   const { studentId, approvedBy } = req.body;
//   try {
//     const finance = await Finance.findOne({ studentId });
//     if (!finance || finance.remainingBalance > 0) {
//       return res.status(400).json({ message: 'Outstanding balance exists.' });
//     }
//     finance.status = 'Cleared';
//     finance.approvedBy = approvedBy;
//     finance.clearedAt = new Date();
//     await finance.save();

//     await Clearance.updateOne(
//       { studentId },
//       { $set: { 'finance.status': 'Cleared', 'finance.clearedAt': new Date() } }
//     );

//     res.status(200).json({ message: 'Finance approved.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Finance approval failed.', error: err.message });
//   }
// };

// export const rejectFinance = async (req, res) => {
//   const { studentId, remarks } = req.body;
//   try {
//     const finance = await Finance.findOne({ studentId });
//     if (!finance) return res.status(404).json({ message: 'Not found.' });

//     finance.status = 'Rejected';
//     finance.remarks = remarks;
//     await finance.save();

//     await Clearance.updateOne(
//       { studentId },
//       { $set: { 'finance.status': 'Rejected' } }
//     );

//     res.status(200).json({ message: 'Finance rejected.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Finance rejection failed.', error: err.message });
//   }
// };

// export const updatePayment = async (req, res) => {
//   const { studentId, newPaymentAmount, method } = req.body;
//   try {
//     const finance = await Finance.findOne({ studentId });
//     if (!finance) return res.status(404).json({ message: 'Finance record not found' });

//     finance.paidAmount += newPaymentAmount;
//     finance.remainingBalance = finance.totalFee - finance.paidAmount;
//     finance.paymentMethod = method || finance.paymentMethod;
//     await finance.save();

//     res.status(200).json({ message: 'Payment updated.', finance });
//   } catch (err) {
//     res.status(500).json({ message: 'Payment update failed.', error: err.message });
//   }
// };
import Finance from '../models/finance.js';
import Student from '../models/Student.js';
import Clearance from '../models/Clearance.js';

// ✅ 1. Fetch full finance summary for a student
export const getStudentFinanceSummary = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId).select('fullName studentId');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const records = await Finance.find({ studentId }).sort({ semester: 1, createdAt: 1 });

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
        amount: `$${rec.amount}`,
        paymentMethod: rec.paymentMethod || '-',
        receiptNumber: rec.receiptNumber || '-',
        balanceAfter: `$${rec.balanceAfter ?? 0}`
      };
    });

    const balance = totalCharges - totalPaid;

    res.status(200).json({
      student: {
        studentId: student.studentId,
        fullName: student.fullName
      },
      summary: {
        totalCharges,
        totalPaid,
        balance,
        canGraduate: balance <= 0
      },
      transactions
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch finance summary', error: err.message });
  }
};

// ✅ 2. Get all pending finance records (for Finance Officer)
export const getPendingFinance = async (req, res) => {
  try {
    const pending = await Finance.find({ status: 'Pending' }).populate('studentId', 'fullName studentId');

    const results = pending.map(entry => ({
      _id: entry._id,
      studentId: entry.studentId?.studentId,
      fullName: entry.studentId?.fullName,
      semester: entry.semester,
      description: entry.description,
      amount: entry.amount,
      type: entry.type,
      status: entry.status,
      createdAt: entry.createdAt
    }));

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending finance records', error: err.message });
  }
};

// ✅ 3. Approve all pending finance records for a student
export const approveFinance = async (req, res) => {
  const { studentId, approvedBy } = req.body;

  try {
    const hasPending = await Finance.exists({ studentId, status: 'Pending' });
    if (!hasPending) {
      return res.status(400).json({ message: 'No pending finance records to approve' });
    }

    await Finance.updateMany(
      { studentId, status: 'Pending' },
      {
        $set: {
          status: 'Cleared',
          approvedBy,
          clearedAt: new Date()
        }
      }
    );

    await Clearance.updateOne(
      { studentId },
      { $set: { 'finance.status': 'Cleared', 'finance.clearedAt': new Date() } }
    );

    res.status(200).json({ message: 'Finance approved and marked as cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Finance approval failed', error: err.message });
  }
};

// ✅ 4. Reject pending finance records for a student
export const rejectFinance = async (req, res) => {
  const { studentId, remarks } = req.body;

  try {
    await Finance.updateMany(
      { studentId, status: 'Pending' },
      {
        $set: {
          status: 'Rejected',
          remarks
        }
      }
    );

    await Clearance.updateOne(
      { studentId },
      { $set: { 'finance.status': 'Rejected' } }
    );

    res.status(200).json({ message: 'Finance records rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Finance rejection failed', error: err.message });
  }
};

// ✅ 5. Add a manual payment
export const updatePayment = async (req, res) => {
  const { studentId, newPaymentAmount, method = 'Cash' } = req.body;

  try {
    const payment = new Finance({
      studentId,
      semester: 0, // Optional: or fetch actual semester from latest record
      type: 'Payment',
      description: `Student Paid $${newPaymentAmount} manually`,
      amount: newPaymentAmount,
      paymentMethod: method,
      receiptNumber: `MANUAL-${Date.now()}`,
      status: 'Approved',
      balanceAfter: 0
    });

    await payment.save();

    res.status(200).json({
      message: 'Manual payment recorded successfully',
      receipt: {
        studentId: payment.studentId,
        amount: payment.amount,
        method: payment.paymentMethod,
        receiptNumber: payment.receiptNumber
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record payment', error: err.message });
  }
};

export const getStudentsWhoPaidGraduationFee = async (req, res) => {
  try {
    const payments = await Finance.find({
      semester: 8,
      type: 'Payment',
      description: { $regex: /Graduation Fee/i }
    }).populate('studentId', 'studentId fullName');

    const result = payments.map(p => ({
      studentId: p.studentId?.studentId,
      fullName: p.studentId?.fullName,
      amount: p.amount,
      receipt: p.receiptNumber,
      paidAt: p.createdAt.toISOString().split('T')[0]
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch graduation payments', error: err.message });
  }
};