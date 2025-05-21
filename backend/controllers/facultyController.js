import Faculty from '../models/faculty.js';
import Clearance from '../models/Clearance.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';

// 🔹 Get all pending faculty records
export const getPendingFaculty = async (req, res) => {
  try {
    const pending = await Faculty.find({ status: 'Pending' })
      .populate('studentId', 'fullName studentId program faculty')
      .populate('groupId', 'groupNumber projectTitle');

    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching faculty clearance.', error: err.message });
  }
};

// 🔹 Approve faculty clearance
export const approveFaculty = async (req, res) => {
  const { studentId, groupId } = req.body;

  try {
    // First, resolve the readable studentId like "CA210014"
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // Now find the Faculty record using the actual ObjectId
    const faculty = await Faculty.findOne({ studentId: student._id });
    if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

    if (!faculty.printedThesisSubmitted || !faculty.signedFormSubmitted || !faculty.softCopyReceived) {
      return res.status(400).json({ message: 'Missing required documents.' });
    }

    faculty.status = 'Approved';
    faculty.rejectionReason = '';
    faculty.facultyRemarks = '';
    faculty.clearedAt = new Date();
    await faculty.save();

    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.faculty.status': 'Approved',
          'clearanceProgress.faculty.date': new Date()
        }
      }
    );

    await Clearance.updateOne(
      { studentId: student._id },
      {
        $set: {
          'faculty.status': 'Approved',
          'faculty.clearedAt': new Date(),
          'faculty.rejectionReason': ''
        }
      },
      { upsert: true } // in case Clearance doesn't exist yet
    );

    res.status(200).json({ message: 'Faculty approved.' });

  } catch (err) {
    res.status(500).json({ message: 'Approval failed.', error: err.message });
  }
};

// 🔹 Reject faculty clearance
export const rejectFaculty = async (req, res) => {
  const { studentId, groupId, rejectionReason } = req.body;

  try {
    const faculty = await Faculty.findOne({ studentId });
    if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

    faculty.status = 'Rejected';
    faculty.rejectionReason = rejectionReason || 'Not provided';
    faculty.facultyRemarks = rejectionReason || '';
    faculty.clearedAt = null;
    await faculty.save();

    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.faculty.status': 'Rejected',
          'clearanceProgress.faculty.date': new Date()
        }
      }
    );

    await Clearance.updateOne(
      { studentId },
      {
        $set: {
          'faculty.status': 'Rejected',
          'faculty.rejectionReason': rejectionReason || 'Not provided',
          'faculty.clearedAt': null
        }
      }
    );

    res.status(200).json({ message: 'Faculty rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed.', error: err.message });
  }
};


export const getFacultyStats = async (req, res) => {
  try {
    const pending = await Faculty.countDocuments({ status: "Pending" });
    const approved = await Faculty.countDocuments({ status: "Approved" });
    const rejected = await Faculty.countDocuments({ status: "Rejected" });

    res.status(200).json({ pending, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch faculty stats", error: err.message });
  }
};

// 🔹 Update document checklist before approval
export const updateFacultyChecklist = async (req, res) => {
  const { studentId, checklist } = req.body;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Faculty.updateOne(
      { studentId: student._id },
      { $set: checklist }
    );

    res.status(200).json({ message: "Checklist updated" });
  } catch (err) {
    res.status(500).json({ message: "Checklist update failed", error: err.message });
  }
};
