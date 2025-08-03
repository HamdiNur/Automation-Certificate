import Clearance from '../models/clearance.js';
import Group from '../models/group.js';
import Appointment from '../models/appointment.js';
import Student from '../models/Student.js';

/**
 * Get clearance steps for a student.
 */
export const getStudentClearance = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const clearance = await Clearance.findOne({ studentId: student._id });
    if (!clearance) return res.status(404).json({ message: 'Clearance not found for student' });

    const clearanceSteps = ['faculty', 'library', 'lab', 'finance', 'examination'].map(dept => ({
      title: dept.charAt(0).toUpperCase() + dept.slice(1),
      status: clearance[dept]?.status || 'Pending',
      clearedOn: clearance[dept]?.date || null,
    }));

    return res.status(200).json({
      studentId: student.studentId,
      clearanceSteps
    });
  } catch (err) {
    console.error('❌ Error fetching clearance:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Get all students whose groups are cleared in Phase One (faculty, library, lab).
 */
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

    const students = groups.flatMap(group =>
      group.members.map(member => ({
        groupNumber: group.groupNumber,
        fullName: member.fullName,
        studentId: member.studentId,
        email: member.email
      }))
    );

    return res.status(200).json({ count: students.length, students });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching cleared students', error: err.message });
  }
};

/**
 * Approve a student's final clearance and schedule an appointment.
 */
export const approveClearance = async (req, res) => {
  const { studentId } = req.body;

  try {
    const clearance = await Clearance.findOne({ studentId });
    if (!clearance) return res.status(404).json({ message: 'Clearance record not found' });

    clearance.status = 'approved';
    await clearance.save();

    const existingAppointment = await Appointment.findOne({ studentId });
    if (!existingAppointment) {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 8);

      await Appointment.create({
        studentId,
        appointmentDate,
        createdBy: req.user?._id || null
      });
    }

    return res.status(200).json({
      message: '✅ Student approved and appointment scheduled.',
      clearanceStatus: clearance.status
    });
  } catch (err) {
    return res.status(500).json({ message: '❌ Failed to approve student', error: err.message });
  }
};

/**
 * Start individual clearance process for a student if group phase is completed.
 */
export const startIndividualClearance = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const clearance = await Clearance.findOne({ studentId: student._id });
    if (!clearance) return res.status(404).json({ message: 'Clearance not found' });

    const { faculty, library, lab, individualClearanceStarted } = clearance;

    const groupCleared = [faculty, library, lab].every(dep => dep?.status === 'Approved');
    if (!groupCleared) {
      return res.status(400).json({ message: 'Group clearance not fully completed yet.' });
    }

    if (individualClearanceStarted) {
      return res.status(200).json({ message: 'Individual clearance already started.' });
    }

    clearance.individualClearanceStarted = true;
    await clearance.save();

    return res.status(200).json({
      message: '✅ Individual clearance started.',
      clearance
    });
  } catch (err) {
    console.error('❌ Error starting individual clearance:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Check if student has completed group phase (faculty, library, lab).
 */
export const checkGroupClearanceStatus = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const clearance = await Clearance.findOne({ studentId: student._id });
    if (!clearance) return res.status(404).json({ message: 'Clearance not found' });

    const isCleared =
      clearance.faculty?.status === 'Approved' &&
      clearance.library?.status === 'Approved' &&
      clearance.lab?.status === 'Approved';

    return res.status(200).json({
      groupPhaseCleared: isCleared,
      departments: {
        faculty: clearance.faculty?.status || 'Pending',
        library: clearance.library?.status || 'Pending',
        lab: clearance.lab?.status || 'Pending'
      }
    });
  } catch (err) {
    console.error('❌ Error checking group clearance:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
