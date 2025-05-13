// 📁 financeController.js
import Finance from '../models/faculty.js';
import Clearance from '../models/Clearance.js';

export const getPendingFinance = async (req, res) => {
  try {
    const pending = await Finance.find({ status: 'Pending' }).populate('studentId');
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching finance.', error: err.message });
  }
};

export const approveFinance = async (req, res) => {
  const { studentId, approvedBy } = req.body;
  try {
    const finance = await Finance.findOne({ studentId });
    if (!finance || finance.remainingBalance > 0) {
      return res.status(400).json({ message: 'Outstanding balance exists.' });
    }
    finance.status = 'Cleared';
    finance.approvedBy = approvedBy;
    finance.clearedAt = new Date();
    await finance.save();

    await Clearance.updateOne(
      { studentId },
      { $set: { 'finance.status': 'Cleared', 'finance.clearedAt': new Date() } }
    );

    res.status(200).json({ message: 'Finance approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Finance approval failed.', error: err.message });
  }
};

export const rejectFinance = async (req, res) => {
  const { studentId, remarks } = req.body;
  try {
    const finance = await Finance.findOne({ studentId });
    if (!finance) return res.status(404).json({ message: 'Not found.' });

    finance.status = 'Rejected';
    finance.remarks = remarks;
    await finance.save();

    await Clearance.updateOne(
      { studentId },
      { $set: { 'finance.status': 'Rejected' } }
    );

    res.status(200).json({ message: 'Finance rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Finance rejection failed.', error: err.message });
  }
};

export const updatePayment = async (req, res) => {
  const { studentId, newPaymentAmount, method } = req.body;
  try {
    const finance = await Finance.findOne({ studentId });
    if (!finance) return res.status(404).json({ message: 'Finance record not found' });

    finance.paidAmount += newPaymentAmount;
    finance.remainingBalance = finance.totalFee - finance.paidAmount;
    finance.paymentMethod = method || finance.paymentMethod;
    await finance.save();

    res.status(200).json({ message: 'Payment updated.', finance });
  } catch (err) {
    res.status(500).json({ message: 'Payment update failed.', error: err.message });
  }
};