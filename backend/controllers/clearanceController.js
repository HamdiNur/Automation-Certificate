import Clearance from '../models/Clearance.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';



export const getStudentClearance = async (req, res) => {
  const { studentId } = req.params;
  try {
    const clearance = await Clearance.findOne({ studentId });
    if (!clearance) return res.status(404).json({ message: 'Clearance record not found' });
    res.status(200).json(clearance);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch clearance record', error: err.message });
  }
};

export const getPhaseOneClearedStudents = async (req, res) => {
  try {
    const groups = await Group.find({
      'clearanceProgress.faculty.status': 'Approved',
      'clearanceProgress.library.status': 'Approved',
      'clearanceProgress.lab.status': 'Approved'
    }).populate('members', 'fullName studentId email');

    if (!groups.length) {
      return res.status(404).json({ message: 'No cleared groups found' });
    }

    // Flatten all student members from groups
    const students = groups.flatMap(group =>
      group.members.map(st => ({
        groupNumber: group.groupNumber,
        fullName: st.fullName,
        studentId: st.studentId,
        email: st.email
      }))
    );

    res.status(200).json({ count: students.length, students });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cleared students', error: err.message });
  }
};