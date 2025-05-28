import Clearance from '../models/Clearance.js';
import Group from '../models/group.js';
import Appointment from '../models/appointment.js';
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



// ✅ Controller to approve clearance and schedule appointment
export const approveClearance = async (req, res) => {
  const { studentId } = req.body;

  try {
    // 1. Check and update the student's clearance status
    const clearance = await Clearance.findOne({ studentId });
    if (!clearance) return res.status(404).json({ message: 'Clearance record not found' });

    clearance.status = 'approved';
    await clearance.save();

    // 2. Check if appointment already exists
    const existingAppointment = await Appointment.findOne({ studentId });
    if (!existingAppointment) {
      const today = new Date();
      const appointmentDate = new Date(today.setDate(today.getDate() + 8));

      await Appointment.create({
        studentId,
        appointmentDate,
        createdBy: req.user._id || null // If you're using auth
      });
    }

    // 3. (Optional) Add a notification if you implement Firebase or MongoDB notifications

    res.status(200).json({
      message: '✅ Student approved and appointment scheduled.',
      clearanceStatus: clearance.status
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Failed to approve student', error: err.message });
  }
};
