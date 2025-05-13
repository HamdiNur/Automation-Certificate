import Examination from '../models/examination.js';
import Clearance from '../models/Clearance.js';
import CourseRecord from '../models/course.js';

// 🔹 Get all pending examination records
export const getPendingExamination = async (req, res) => {
  try {
    const pending = await Examination.find({ status: 'Pending' }).populate('studentId');
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending examinations', error: err.message });
  }
};

// 🔹 Approve examination (after all requirements are met)
export const approveExamination = async (req, res) => {
  const { studentId, approvedBy } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found.' });

    const courseRecord = await CourseRecord.findOne({ studentId });
    const hasPassedAll = courseRecord && courseRecord.courses.every(c => c.passed);

    const { passportUploaded, otherDocsVerified } = exam.requiredDocs;

    if (!hasPassedAll || !passportUploaded || !otherDocsVerified || !exam.canGraduate) {
      return res.status(400).json({ message: 'Student does not meet final clearance requirements.' });
    }

    exam.status = 'Approved';
    exam.clearedAt = new Date();
    exam.approvedBy = approvedBy;
    await exam.save();

    await Clearance.updateOne(
      { studentId },
      {
        $set: {
          'examination.status': 'Approved',
          'examination.clearedAt': new Date(),
          finalStatus: 'Cleared'
        }
      }
    );

    res.status(200).json({ message: 'Examination clearance approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve examination.', error: err.message });
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

// 🔹 Upload final clearance certificate (PDF)
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
  const { studentId, appointmentDate } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found.' });

    exam.appointmentDate = new Date(appointmentDate);
    await exam.save();

    res.status(200).json({ message: 'Appointment scheduled.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to schedule appointment.', error: err.message });
  }
};

// 🔹 Mark check-in when student arrives for certificate
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
