import Lab from '../models/lab.js';
import Group from '../models/group.js';
import Clearance from '../models/Clearance.js';

export const getPendingLab = async (req, res) => {
  try {
    const pending = await Lab.find({ status: 'Pending' }).populate('studentId groupId');
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching lab clearance.', error: err.message });
  }
};

export const approveLab = async (req, res) => {
  const { studentId, groupId, approvedBy, returnedItems } = req.body;
  try {
    const lab = await Lab.findOne({ studentId });
    if (!lab) return res.status(404).json({ message: 'Lab record not found.' });

    lab.status = 'Approved';
    lab.returnedItems = returnedItems;
    lab.approvedBy = approvedBy;
    lab.clearedAt = new Date();
    await lab.save();

    await Group.updateOne(
      { _id: groupId },
      { $set: { 'clearanceProgress.lab.status': 'Approved', 'clearanceProgress.lab.date': new Date() } }
    );

    await Clearance.updateOne(
      { studentId },
      { $set: { 'lab.status': 'Approved', 'lab.clearedAt': new Date() } }
    );

    res.status(200).json({ message: 'Lab approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Lab approval failed.', error: err.message });
  }
};

export const rejectLab = async (req, res) => {
  const { studentId, issues } = req.body;
  try {
    const lab = await Lab.findOne({ studentId });
    if (!lab) return res.status(404).json({ message: 'Not found.' });

    lab.status = 'Rejected';
    lab.issues = issues;
    await lab.save();

    await Clearance.updateOne(
      { studentId },
      { $set: { 'lab.status': 'Rejected' } }
    );

    res.status(200).json({ message: 'Lab rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Lab rejection failed.', error: err.message });
  }
};
