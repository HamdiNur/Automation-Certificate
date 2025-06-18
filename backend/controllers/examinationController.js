import Examination from '../models/examination.js';
import Clearance from '../models/clearance.js';
import CourseRecord from '../models/course.js';
import Student from '../models/Student.js';
import Appointment from '../models/appointment.js'; // ✅ Added f appointment handling


// 🔹 Get all pending examination records
export const getPendingExamination = async (req, res) => {
  try {
    // Find students who completed Phase One and paid graduation fee
    const students = await Clearance.find({
      "faculty.status": "Approved",
      "library.status": "Approved",
      "lab.status": "Approved",
      "finance.status": "Approved"
    }).populate("studentId");


    // Get only student IDs
    const eligibleIds = students.map((clr) => clr.studentId?._id).filter(Boolean);

    // Fetch examination records for those students
  const pending = await Examination.find({
  studentId: { $in: eligibleIds },
  clearanceStatus: "Pending"
}).populate("studentId");

    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending examinations", error: err.message });
  }
};
// 🔹 Approve examination (final clearance logic)


// 🔹 Approve examination (final clearance logic)
export const approveExamination = async (req, res) => {
  const { studentId, approvedBy } = req.body;

  try {
    const exam = await Examination.findOne({ studentId });
    const student = await Student.findById(studentId);

    if (!exam || !student) {
      return res.status(404).json({ message: 'Examination or student record not found.' });
    }

    // Check if student passed all courses
    const courseRecords = await CourseRecord.find({ studentId });
    const hasPassedAll = courseRecords.every(c => c.passed);

    if (!hasPassedAll || !exam.canGraduate) {
      return res.status(400).json({ message: 'Student has not met graduation criteria.' });
    }

    // 🔒 Enforce decision presence
    if (student.nameCorrectionRequested === undefined || student.nameCorrectionRequested === null) {
      return res.status(400).json({
        message: 'You must confirm if a name correction is requested.'
      });
    }

    // ✅ Case: No name correction requested
    if (student.nameCorrectionRequested === false) {
      // Do nothing, continue to approve
    }

    // ❌ Case: Name correction requested but missing data
  else if (
  student.nameCorrectionRequested === true &&
  (
    !student.requestedName ||
    exam?.requiredDocs?.passportVerified !== true
  )
) {
  return res.status(400).json({
    message: 'Name correction requested but either requested name or passport document is missing or not verified.'
  });
}

    // ✅ Case: Name correction requested and valid
    else if (
      student.nameCorrectionRequested === true &&
      student.requestedName &&
      exam?.requiredDocs?.passportUploaded === true
    ) {
      student.fullName = student.requestedName;
      student.nameVerified = true;
      student.requestedName = '';
      await student.save();

      await Examination.findOneAndUpdate(
        { studentId },
        { nameConfirmed: true }
      );
    }

    // ✅ Update exam clearance
    const now = new Date();
    exam.clearanceStatus = 'Approved';
    exam.clearedAt = now;
    exam.finalDecisionBy = approvedBy;
    await exam.save();

    // ✅ Update clearance record
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

    // 🕒 Check & create appointment (if not exists)
    const existing = await Appointment.findOne({ studentId });
    if (!existing) {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 3);

      await Appointment.create({
        studentId,
        appointmentDate,
        createdBy: approvedBy
      });
    }

    res.status(200).json({
      message: '✅ Examination approved successfully and appointment scheduled.'
    });

  } catch (err) {
    res.status(500).json({
      message: '❌ Failed to approve examination.',
      error: err.message
    });
  }
};



// Approve only name correction
export const approveNameCorrection = async (req, res) => {
  const { studentId } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (!student.nameCorrectionRequested) {
      return res.status(400).json({ message: 'No name correction request found' });
    }

    // Update student's full name to the requested name
    student.fullName = student.requestedName;
    student.nameVerified = true;
    student.requestedName = ''; // Optionally clear the requested name
    await student.save();

    // Update examination record for name confirmation
    await Examination.findOneAndUpdate(
      { studentId },
      { nameConfirmed: true }
    );

    res.status(200).json({ message: '✅ Name correction approved and full name updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve name correction', error: err.message });
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
  const { studentId, requestedName } = req.body; // 🆕 requestedName is required to compare

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (!student.nameCorrectionRequested) {
      return res.status(403).json({
        message: '❌ You must first confirm your name correction request.'
      });
    }

    // ✅ Check if first names are completely different (major change)
    const isMajorCorrection = student.fullName.split(' ')[0] !== requestedName?.split(' ')[0];

    exam.nameCorrectionDoc = 'Pending';
    exam.forwardedToAdmission = isMajorCorrection;
    exam.forwardedReason = isMajorCorrection
      ? "Major name change requested. Forwarded to Admission Office for verification."
      : null;

    await exam.save();

    res.status(200).json({
      message: isMajorCorrection
        ? "Your request was forwarded to the Admission Office."
        : "Name correction request recorded.",
      forwarded: isMajorCorrection
    });

  } catch (err) {
    res.status(500).json({ message: 'Failed to update request', error: err.message });
  }
};



// 🆕 Upload verification document (passport/school cert)
export const uploadNameCorrectionDoc = async (req, res) => {
  const { studentId, requestedName } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const exam = await Examination.findOne({ studentId });
    if (!exam) return res.status(404).json({ message: 'Examination record not found' });

    // ✅ Save document to exam
    exam.nameCorrectionDoc = file.path;
    exam.requiredDocs.passportUploaded = true;
    await exam.save();

    // ✅ Save requested name to student
    await Student.findByIdAndUpdate(studentId, {
      requestedName
    });

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
// 🔹 Dashboard Stats for Examination Officer
export const getExaminationStats = async (req, res) => {
  try {
    // ✅ Only count true pending examination records
    const truePending = await Examination.countDocuments({
      clearanceStatus: "Pending"
    });

    // ✅ Fetch name corrections with valid student references
    const nameCorrectionsWithStudent = await Examination.find({
      nameCorrectionDoc: { $exists: true, $ne: null }
    }).populate("studentId");

    const validNameCorrections = nameCorrectionsWithStudent.filter(e => e.studentId != null);
    const nameCorrections = validNameCorrections.length;

    // ✅ Count approved examinations
    const approved = await Examination.countDocuments({
      clearanceStatus: "Approved"
    });

    res.status(200).json({
      pending: truePending,
      nameCorrections,
      approved
    });

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



export const getEligibleStudentsSummary = async (req, res) => {
  try {
    const eligibleStudents = await Examination.find({
      clearanceStatus: 'Pending',
      canGraduate: { $in: [true, false] } // Include both
    }).populate({
      path: 'studentId',
      match: { clearanceStatus: 'approved' }, // ✅ Already finished Phase One
      select: 'fullName studentId program email'
    });

    // Filter out null student (those who don't match in populate)
    const filtered = eligibleStudents.filter(e => e.studentId);

    const total = filtered.length;
    const passed = filtered.filter(e => e.hasPassedAllCourses).length;
    const eligibleToGraduate = filtered.filter(e => e.canGraduate).length;
    const notEligible = total - eligibleToGraduate;

    res.status(200).json({
      total,
      passedAllCourses: passed,
      canGraduate: eligibleToGraduate,
      notEligible
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch eligibility summary", error: err.message });
  }
};


export const checkCertificateEligibility = async (req, res) => {
  const { studentId } = req.params;

  try {
    const exam = await Examination.findOne({ studentId });
    const clearance = await Clearance.findOne({ studentId });

    if (!exam || !clearance) {
      return res.status(404).json({ message: "Examination or Clearance record not found" });
    }

    const clearedPhase1 =
      clearance.faculty.status === 'Approved' &&
      clearance.lab.status === 'Approved' &&
      clearance.library.status === 'Approved';

    const clearedPhase2 = clearance.finance.status === 'Approved';

    if (!clearedPhase1 || !clearedPhase2) {
      return res.status(200).json({
        canProceed: false,
        message: "Please complete all clearance stages."
      });
    }

    if (!exam.hasPassedAllCourses) {
      return res.status(200).json({
        canProceed: false,
        failedCourses: true,
        showNameCorrectionOption: false,
        message: "You failed some courses. Re-exam is required."
      });
    }

    return res.status(200).json({
      canProceed: true,
      failedCourses: false,
      showNameCorrectionOption: true,
      message: "You are eligible for certificate issuance. Do you need a name correction?"
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal error",
      error: error.message
    });
  }
};


// // Get all name correction requests with student + document
// export const getNameCorrectionRequests = async (req, res) => {
//   try {
//     const corrections = await Examination.find({
//       nameCorrectionDoc: { $exists: true, $ne: null }
//     }).populate("studentId");

//     const result = corrections.map((e) => ({
//       studentId: e.studentId?.studentId || "N/A",
//       fullName: e.studentId?.fullName || "N/A",
//       requestedName: e.studentId?.requestedName || "N/A",
//       correctionUploadUrl: e.nameCorrectionDoc || "",
//       nameVerified: e.studentId?.nameVerified || false,
//       _id: e.studentId?._id
//     }));

//     res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch correction requests", error: err.message });
//   }
// };
