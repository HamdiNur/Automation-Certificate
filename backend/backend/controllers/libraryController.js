import Library from '../models/library.js';
import Clearance from '../models/Clearance.js';
import Group from '../models/group.js';

export const getPendingLibrary = async (req, res) => {
  try {
    const pending = await Library.find({ status: 'Pending' }).populate('studentId groupId');
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching library clearance.', error: err.message });
  }
};

export const approveLibrary = async (req, res) => {
  const { studentId, groupId, libraryStaffId } = req.body;
  try {
    const library = await Library.findOne({ studentId });
    if (!library) return res.status(404).json({ message: 'Library record not found.' });

    library.status = 'Approved';
    library.thesisBookReveiced = true;
    library.thesisBookReceivedDate = new Date();
    library.libraryStaffId = libraryStaffId;
    library.clearedAt = new Date();
    await library.save();

    await Group.updateOne(
      { _id: groupId },
      { $set: { 'clearanceProgress.library.status': 'Approved', 'clearanceProgress.library.date': new Date() } }
    );

    await Clearance.updateOne(
      { studentId },
      { $set: { 'library.status': 'Approved', 'library.clearedAt': new Date() } }
    );

    res.status(200).json({ message: 'Library approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed.', error: err.message });
  }
};

export const rejectLibrary = async (req, res) => {
  const { studentId, remarks } = req.body;
  try {
    const library = await Library.findOne({ studentId });
    if (!library) return res.status(404).json({ message: 'Not found.' });

    library.status = 'Rejected';
    library.remarks = remarks;
    await library.save();

    await Clearance.updateOne(
      { studentId },
      { $set: { 'library.status': 'Rejected' } }
    );

    res.status(200).json({ message: 'Library rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed.', error: err.message });
  }
};