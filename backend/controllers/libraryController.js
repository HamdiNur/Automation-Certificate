// ✅ Cleaned & Corrected: backend/controllers/libraryController.js

import Library from '../models/library.js';
import Clearance from '../models/Clearance.js';
import Group from '../models/group.js';

// 🔹 Get all pending library records
export const getPendingLibrary = async (req, res) => {
  try {
    const pending = await Library.find({ status: 'Pending' })
      .populate('members', 'fullName studentId email')
      .populate('groupId', 'groupNumber program faculty');
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching library clearance.', error: err.message });
  }
};

// 🔹 Approve library clearance
export const approveLibrary = async (req, res) => {
  const { groupId, libraryStaffId } = req.body;
  try {
    const library = await Library.findOne({ groupId });
    if (!library) return res.status(404).json({ message: 'Library record not found.' });

    library.status = 'Approved';
    library.thesisBookReveiced = true;
    library.thesisBookReceivedDate = new Date();
    library.libraryStaffId = libraryStaffId;
    library.clearedAt = new Date();
    await library.save();

    // ✅ Update clearance progress in group and clearance
    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.library.status': 'Approved',
          'clearanceProgress.library.date': new Date()
        }
      }
    );

    await Clearance.updateMany(
      { groupId },
      {
        $set: {
          'library.status': 'Approved',
          'library.clearedAt': new Date()
        }
      }
    );

    // ✅ Update student records
    await Student.updateMany(
      { _id: { $in: library.members } },
      { $set: { clearanceStatus: 'Approved', isCleared: true } }
    );

    res.status(200).json({ message: 'Library approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed.', error: err.message });
  }
};


// 🔹 Reject library clearance
export const rejectLibrary = async (req, res) => {
  const { groupId, remarks } = req.body;
  try {
    const library = await Library.findOne({ groupId });
    if (!library) return res.status(404).json({ message: 'Not found.' });

    library.status = 'Rejected';
    library.remarks = remarks || 'No remarks';
    await library.save();

    await Clearance.updateMany(
      { groupId },
      { $set: { 'library.status': 'Rejected' } }
    );

    res.status(200).json({ message: 'Library rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed.', error: err.message });
  }
};

// 🔹 Get all library clearance records
export const getAllLibraryClearances = async (req, res) => {
  try {
    const records = await Library.find()
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId email');
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch library clearances', message: err.message });
  }
};

// 🔹 Get library record by group ID
export const getLibraryByGroupId = async (req, res) => {
  try {
    const record = await Library.findOne({ groupId: req.params.groupId })
      .populate('groupId', 'groupNumber program')
      .populate('members', 'fullName studentId email');
    if (!record) return res.status(404).json({ message: 'Library clearance not found for this group.' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching record by group ID', message: err.message });
  }
};

// 🔹 Update library clearance status
export const updateLibraryStatus = async (req, res) => {
  try {
    const { groupId, status, remarks } = req.body;
    const record = await Library.findOne({ groupId });
    if (!record) return res.status(404).json({ message: 'Library record not found' });

    record.status = status || record.status;
    record.remarks = remarks || record.remarks;
    if (status === 'Approved') {
      record.clearedAt = new Date();
    }
    await record.save();

    res.status(200).json({ message: 'Library status updated', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update library clearance', message: err.message });
  }
};

// 🔹 Get library clearance for a specific student
export const getLibraryByStudentId = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const record = await Library.findOne({ members: studentId })
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId email');

    if (!record) {
      return res.status(404).json({ message: 'No library clearance found for this student.' });
    }

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch library record', message: err.message });
  }
};

export const getLibraryStats = async (req, res) => {
  try {
    const approved = await Library.countDocuments({ status: 'Approved' });
    const pending = await Library.countDocuments({ status: 'Pending' });
    const rejected = await Library.countDocuments({ status: 'Rejected' });

    res.status(200).json({ approved, pending, rejected });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats', message: err.message });
  }
};
