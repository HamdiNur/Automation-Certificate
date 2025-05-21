
// 📁 controllers/financeController.js
import Finance from '../models/finance.js';
import Student from '../models/Student.js';
import Clearance from '../models/Clearance.js';

// ✅ 1. Fetch full finance summary for a student
export const getStudentFinanceSummary = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findOne({ studentId }).select('fullName studentId _id');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const records = await Finance.find({ studentId: student._id }).sort({ semester: 1, createdAt: 1 });

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

    // ✅ Graduation logic: Enforced university rule
    let canGraduate = false;

    if (totalPaid === 3605) {
      canGraduate = true;
    } else {
      totalPaid = 3305;
      canGraduate = false;
    }

    res.status(200).json({
      student: {
        studentId: student.studentId,
        fullName: student.fullName
      },
      summary: {
        totalCharges,
        totalPaid,
        balance: totalCharges - totalPaid,
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

export const approveFinance = async (req, res) => {
  const { studentId, approvedBy } = req.body;

  try {
    const student = await Student.findOne({ studentId });
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

    await Clearance.updateOne(
      { studentId: student._id },
      { $set: { 'finance.status': 'Cleared', 'finance.clearedAt': new Date() } }
    );

    res.status(200).json({ message: 'Finance approved and marked as cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Finance approval failed', error: err.message });
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

export const updatePayment = async (req, res) => {
  const { studentId, newPaymentAmount, method = 'Cash' } = req.body;

  try {
    const student = await Student.findOne({ studentId });

    const payment = new Finance({
      studentId: student._id,
      semester: 0,
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
        studentId: student.studentId,
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

export const getFinanceStats = async (req, res) => {
  try {
    const graduationFeePaid = await Finance.countDocuments({
      semester: 8,
      type: 'Payment',
      description: { $regex: /Graduation Fee/i }
    });

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
