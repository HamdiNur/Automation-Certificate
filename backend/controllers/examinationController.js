import Examination from '../models/examination.js';
import Clearance from '../models/Clearance.js';
import CourseRecord from '../models/course.js';
import Student from '../models/Student.js';

// 🔹 Get all pending examination records
export const getPendingExamination = async (req, res) => {
  try {
    const pending = await Examination.find({ status: 'Pending' }).populate('studentId');
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending examinations', error: err.message });
  }
};

// 🔹 Approve examination (final clearance logic)
export const approveExamination = async (req, res) => {
  const { studentId, approvedBy } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found.' });

    // ✅ Check if student passed all courses
    const courseRecords = await CourseRecord.find({ studentId });
    const hasPassedAll = courseRecords.every(c => c.passed);

    if (!hasPassedAll || !exam.canGraduate) {
      return res.status(400).json({ message: 'Student has not met graduation criteria.' });
    }

    // ✅ If name correction is requested, check required docs
    const nameCorrectionRequested = !!exam.nameCorrectionDoc;
    if (nameCorrectionRequested) {
      const { passportUploaded, otherDocsVerified } = exam.requiredDocs;
      if (!passportUploaded || !otherDocsVerified) {
        return res.status(400).json({
          message: 'Name correction requires valid passport and document verification.'
        });
      }
    }

    // ✅ Set appointment 8 days later
    const now = new Date();
    const autoAppointmentDate = new Date(now);
    autoAppointmentDate.setDate(now.getDate() + 8);

    exam.status = 'Approved';
    exam.clearedAt = now;
    exam.appointmentDate = autoAppointmentDate;
    exam.finalDecisionBy = approvedBy;
    await exam.save();

    await Clearance.updateOne(
      { studentId },
      {
        $set: {
          'examination.status': 'Approved',
          'examination.clearedAt': now,
          finalStatus: 'Cleared'
        }
      }
    );

    res.status(200).json({
      message: 'Examination clearance approved. Appointment scheduled automatically.',
      appointmentDate: autoAppointmentDate
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve examination.', error: err.message });
  }
};

// 🔹 Confirm and update student name
export const confirmStudentName = async (req, res) => {
  const { studentId, newName } = req.body;

  try {
    await Student.findByIdAndUpdate(studentId, { fullName: newName });
    await Examination.findOneAndUpdate(
      { studentId },
      { nameConfirmed: true }
    );
    res.status(200).json({ message: 'Name updated and confirmed.' });
  } catch (err) {
    res.status(500).json({ message: 'Name confirmation failed.', error: err.message });
  }
};

// 🔹 Reject examination
export const rejectExamination = async (req, res) => {
  const { studentId, remarks } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found.' });

    exam.status = 'Rejected';
    exam.remarks = remarks;
    exam.clearedAt = null;
    await exam.save();

    await Clearance.updateOne(
      { studentId },
      { $set: { 'examination.status': 'Rejected' } }
    );

    res.status(200).json({ message: 'Examination rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject examination.', error: err.message });
  }
};

// 🔹 Upload final clearance certificate
export const uploadCertificate = async (req, res) => {
  const { studentId, confirmationPdfUrl } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found.' });

    exam.confirmationPdfUrl = confirmationPdfUrl;
    await exam.save();

    res.status(200).json({ message: 'Certificate uploaded.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload certificate.', error: err.message });
  }
};

// 🔹 Schedule appointment for certificate collection
export const scheduleAppointment = async (req, res) => {
  const { studentId, appointmentDate, reason } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found.' });

    exam.appointmentDate = new Date(appointmentDate);
    if (reason) {
      exam.rescheduleReason = reason;
    }
    await exam.save();

    res.status(200).json({
      message: 'Appointment scheduled successfully.',
      newDate: appointmentDate,
      reason: reason || null
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to schedule appointment.', error: err.message });
  }
};

// 🔹 Mark check-in when student arrives
export const markCheckIn = async (req, res) => {
  const { studentId } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found.' });

    exam.checkedIn = true;
    exam.attendedAt = new Date();
    await exam.save();

    res.status(200).json({ message: 'Check-in marked.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark check-in.', error: err.message });
  }
};

// 🔹 Get failed courses (re-exam)
export const getFailedCourses = async (req, res) => {
  const { studentId } = req.params;

  try {
    const failed = await CourseRecord.find({ studentId, passed: false });
    res.status(200).json(failed);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get re-exam courses', error: err.message });
  }
};
