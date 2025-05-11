import Faculty from '../models/faculty.js';
import Clearance from '../models/Clearance.js';
import Group from '../models/group.js';

export const getPendingFaculty = async (req, res) => {
  try {
    const pending = await Faculty.find({ status: 'Pending' }).populate('studentId groupId');
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching faculty clearance.', error: err.message });
  }
};

export const approveFaculty = async (req, res) => {
  const { studentId, groupId } = req.body;
  try {
    const faculty = await Faculty.findOne({ studentId });
    if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

    if (!faculty.printedThesisSubmitted || !faculty.signedFormSubmitted || !faculty.softCopyUrl) {
      return res.status(400).json({ message: 'Missing required documents.' });
    }

    faculty.status = 'Approved';
    faculty.clearedAt = new Date();
    await faculty.save();

    await Group.updateOne(
      { _id: groupId },
      { $set: { 'clearanceProgress.faculty.status': 'Approved', 'clearanceProgress.faculty.date': new Date() } }
    );

    await Clearance.updateOne(
      { studentId },
      { $set: { 'faculty.status': 'Approved', 'faculty.clearedAt': new Date() } }
    );

    res.status(200).json({ message: 'Faculty approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed.', error: err.message });
  }
};

export const rejectFaculty = async (req, res) => {
  const { studentId, facultyRemarks } = req.body;
  try {
    const faculty = await Faculty.findOne({ studentId });
    if (!faculty) return res.status(404).json({ message: 'Not found.' });

    faculty.status = 'Rejected';
    faculty.facultyRemarks = facultyRemarks;
    await faculty.save();

    await Clearance.updateOne(
      { studentId },
      { $set: { 'faculty.status': 'Rejected' } }
    );

    res.status(200).json({ message: 'Faculty rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed.', error: err.message });
  }
};