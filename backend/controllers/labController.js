import Lab from '../models/lab.js';
import Student from '../models/Student.js';
import Group from '../models/group.js';
import Clearance from '../models/Clearance.js';

// 🔹 Get all lab records
export const getAllLabClearances = async (req, res) => {
  try {
    const records = await Lab.find()
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId email');
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab records', message: err.message });
  }
};

// 🔹 Get pending lab records
export const getPendingLab = async (req, res) => {
  try {
    const records = await Lab.find({ status: 'Pending' })
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId studentId email');
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pending labs', message: err.message });
  }
};

// 🔹 Approve lab clearance
export const approveLab = async (req, res) => {
  const { groupId, labStaffId } = req.body;
  try {
    const lab = await Lab.findOne({ groupId });
    if (!lab) return res.status(404).json({ message: 'Lab record not found.' });

    lab.status = 'Approved';
    lab.clearedAt = new Date();
    lab.approvedBy = labStaffId;
    await lab.save();

    await Clearance.updateMany(
      { groupId },
      {
        $set: {
          'lab.status': 'Approved',
          'lab.clearedAt': new Date()
        }
      }
    );

    await Student.updateMany(
      { _id: { $in: lab.members } },
      {
        $set: {
          clearanceStatus: 'Approved',
          isCleared: true
        }
      }
    );

    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.lab.status': 'Approved',
          'clearanceProgress.lab.date': new Date()
        }
      }
    );

    res.status(200).json({ message: 'Lab clearance approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Lab approval failed.', error: err.message });
  }
};

// 🔹 Reject lab clearance
export const rejectLab = async (req, res) => {
  const { groupId, remarks } = req.body;
  try {
    const lab = await Lab.findOne({ groupId });
    if (!lab) return res.status(404).json({ message: 'Lab record not found.' });

    lab.status = 'Rejected';
    lab.remarks = remarks || 'No remarks';
    await lab.save();

    await Clearance.updateMany(
      { groupId },
      { $set: { 'lab.status': 'Rejected' } }
    );

    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.lab.status': 'Rejected',
          'clearanceProgress.lab.date': new Date()
        }
      }
    );

    res.status(200).json({ message: 'Lab clearance rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed.', error: err.message });
  }
};

// 🔹 Update lab status
export const updateLabStatus = async (req, res) => {
  try {
    const { groupId, status, remarks } = req.body;
    const record = await Lab.findOne({ groupId });
    if (!record) return res.status(404).json({ message: 'Lab record not found' });

    record.status = status || record.status;
    record.remarks = remarks || record.remarks;
    if (status === 'Approved') {
      record.clearedAt = new Date();
    }
    await record.save();

    res.status(200).json({ message: 'Lab status updated', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lab clearance', message: err.message });
  }
};

// 🔹 Get lab record by group ID
export const getLabByGroupId = async (req, res) => {
  try {
    const record = await Lab.findOne({ groupId: req.params.groupId })
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId email');
    if (!record) return res.status(404).json({ message: 'Lab clearance not found for this group.' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching lab record by group ID', message: err.message });
  }
};

// 🔹 Get lab record by student ID
export const getLabByStudentId = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const record = await Lab.findOne({ members: studentId })
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId email');

    if (!record) {
      return res.status(404).json({ message: 'No lab clearance found for this student.' });
    }

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab record', message: err.message });
  }
};

// 🔹 Dashboard stats
export const getLabStats = async (req, res) => {
  try {
    const approved = await Lab.countDocuments({ status: 'Approved' });
    const pending = await Lab.countDocuments({ status: 'Pending' });
    const rejected = await Lab.countDocuments({ status: 'Rejected' });

    res.status(200).json({ approved, pending, rejected });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab stats', message: err.message });
  }
};
