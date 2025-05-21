// ✅ backend/controllers/labController.js — Full Lab Logic

import Lab from '../models/lab.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';

// 🔹 Get all lab clearance records
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

// 🔹 Get lab record by group ID
export const getLabByGroupId = async (req, res) => {
  try {
    const record = await Lab.findOne({ groupId: req.params.groupId })
      .populate('groupId', 'groupNumber program')
      .populate('members', 'fullName studentId email');
    if (!record) return res.status(404).json({ message: 'Lab clearance not found for this group.' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching lab record by group ID', message: err.message });
  }
};

// 🔹 Get lab clearance for a specific student
export const getLabByStudentId = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const record = await Lab.findOne({ members: studentId })
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId email');

    if (!record) return res.status(404).json({ message: 'Lab clearance not found for this student.' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab record', message: err.message });
  }
};

// 🔹 Get only pending lab records
export const getPendingLab = async (req, res) => {
  try {
    const records = await Lab.find({ status: 'Pending' })
      .populate('groupId', 'groupNumber program')
      .populate('members', 'fullName studentId email');
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending records', message: err.message });
  }
};

// 🔹 Approve lab clearance

export const approveLab = async (req, res) => {
  try {
    const { groupId, approvedBy, returnedItems, issues } = req.body;
    const record = await Lab.findOne({ groupId });
    if (!record) return res.status(404).json({ message: 'Lab record not found' });

    record.status = 'Approved';
    record.clearedAt = new Date();
    record.approvedBy = approvedBy || 'System';

    record.returnedItems = returnedItems || record.returnedItems || 'All items returned';
    record.issues = issues || record.issues || 'None';

    await record.save();

    res.status(200).json({ message: 'Lab record approved', record });
  } catch (err) {
    res.status(500).json({ error: 'Approval failed', message: err.message });
  }
};

// 🔹 Reject lab clearance
export const rejectLab = async (req, res) => {
  try {
    const { groupId, issues } = req.body;
    const record = await Lab.findOne({ groupId });
    if (!record) return res.status(404).json({ message: 'Lab record not found' });

    record.status = 'Rejected';
    record.issues = issues || 'Unspecified';
    await record.save();

    res.status(200).json({ message: 'Lab record rejected', record });
  } catch (err) {
    res.status(500).json({ error: 'Rejection failed', message: err.message });
  }
};


// 🔹 Get counts of lab clearance statuses
export const getLabStats = async (req, res) => {
  try {
    const approved = await Lab.countDocuments({ status: 'Approved' });
    const pending = await Lab.countDocuments({ status: 'Pending' });
    const rejected = await Lab.countDocuments({ status: 'Rejected' });

    res.status(200).json({ approved, pending, rejected });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab stats', message: err.message });
  }
}

export const getLabProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assume token verification middleware sets req.user
    const profile = await Lab.findById(userId);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
};