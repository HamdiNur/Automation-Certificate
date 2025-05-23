import Examination from '../models/examination.js';
import Clearance from '../models/Clearance.js';
import CourseRecord from '../models/course.js';
import Student from '../models/Student.js';

// 🔹 Get all pending examination records
export const getPendingExamination = async (req, res) => {
  try {
const pending = await Examination.find({ clearanceStatus: 'Pending' }).populate('studentId');
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

    
    exam.clearanceStatus = 'Approved'; // ✅ correct
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

    exam.clearanceStatus = 'Rejected'; // ✅
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

/// 🆕 Student requests name correction
export const requestNameCorrection = async (req, res) => {
  const { studentId } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found' });

    exam.nameCorrectionDoc = 'Pending'; // temporary placeholder
    await exam.save();

    res.status(200).json({ message: 'Name correction request recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update request', error: err.message });
  }
};

// 🆕 Upload verification document (passport/school cert)
export const uploadNameCorrectionDoc = async (req, res) => {
  const { studentId } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found' });

    exam.nameCorrectionDoc = file.path;
    exam.requiredDocs.passportUploaded = true;
    await exam.save();

    res.status(200).json({
      message: 'Document uploaded successfully',
      path: file.path
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

export const getFullyClearedStudents = async (req, res) => {
  try {
    const cleared = await Clearance.find({
      "faculty.status": "Approved",
      "library.status": "Approved",
      "lab.status": "Approved",
      "finance.status": "Approved"
    }).populate("studentId", "fullName studentId program email");

    res.status(200).json(cleared);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cleared students", error: err.message });
  }
};

//🔹 Dashboard Stats for Examination Officer
export const getExaminationStats = async (req, res) => {
  try {
   const pending = await Examination.countDocuments({ clearanceStatus: "Pending" });
    const nameCorrections = await Examination.countDocuments({ nameCorrectionDoc: { $exists: true, $ne: null } });
 const approved = await Examination.countDocuments({ clearanceStatus: "Approved" });

    res.status(200).json({ pending, nameCorrections, approved });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch examination stats", error: err.message });
  }
};

// 🔹 Get total number of passed and failed students
export const getPassFailSummary = async (req, res) => {
  try {
    // Group course records by studentId and determine if they failed any course
    const courseSummary = await CourseRecord.aggregate([
      {
        $group: {
          _id: "$studentId",
          failedCourses: {
            $sum: {
              $cond: [{ $eq: ["$passed", false] }, 1, 0]
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          passedCount: {
            $sum: {
              $cond: [{ $eq: ["$failedCourses", 0] }, 1, 0]
            }
          },
          failedCount: {
            $sum: {
              $cond: [{ $gt: ["$failedCourses", 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const { passedCount = 0, failedCount = 0 } = courseSummary[0] || {};
    res.status(200).json({ passed: passedCount, failed: failedCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pass/fail summary", error: err.message });
  }
};


// ✅ Revalidate after student re-exam and finance approval
export const revalidateGraduationEligibility = async (req, res) => {
  const { studentId } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found.' });

    // Re-check course status
    const failed = await CourseRecord.exists({ studentId, passed: false });
    const passedAll = !failed;

    // Re-check finance approval
    const financeApproved = await Clearance.findOne({
      studentId,
      "finance.status": "Approved"
    });

    const canGraduate = passedAll && !!financeApproved;

    exam.hasPassedAllCourses = passedAll;
    exam.canGraduate = canGraduate;

    await exam.save();

    res.status(200).json({
      message: "Graduation eligibility revalidated",
      hasPassedAllCourses: passedAll,
      canGraduate
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to revalidate eligibility.', error: err.message });
  }
};
