import mongoose from 'mongoose';
import Faculty from '../models/faculty.js';
import Clearance from '../models/clearance.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import Library from '../models/library.js';

export const startFacultyClearance = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).populate('groupId');

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ Must be assigned to a group
    if (!student.groupId) {
      return res.status(400).json({ message: "Student not assigned to a group" });
    }

    // ✅ Must be in final year
    const currentYear = new Date().getFullYear();
    if (student.yearOfGraduation !== currentYear) {
      return res.status(400).json({ message: "Only final-year students can start clearance" });
    }

    // ✅ Must have pending clearance status
    if (student.clearanceStatus !== 'Pending') {
      return res.status(400).json({ message: "Clearance not allowed for this student" });
    }

    const groupId = student.groupId._id;
    const thesisTitle = student.groupId.projectTitle || "Untitled Project";

    // 🔁 Check if Faculty clearance already exists
    const existing = await Faculty.findOne({ groupId }).populate('history.startedBy', 'fullName studentId');
    if (existing) {
      return res.status(200).json({
        message: "Faculty clearance already started by your group",
        alreadyExists: true,
        status: existing.status,
        data: existing,
        startedBy: existing.history.find(h => h.status === 'Pending')?.startedBy
      });
    }

    // ✅ Create new Faculty clearance
    const faculty = new Faculty({
      groupId,
      members: student.groupId.members.map(m => m.student),
      thesisTitle,
      status: "Pending",
      requestedAt: new Date(),
      history: [
        {
          status: 'Pending',
          reason: 'Clearance started by student',
          startedBy: student._id,
          date: new Date()
        }
      ]
    });

    await faculty.save();

    // ✅ Emit real-time event to faculty dashboard
    global._io.emit('new-clearance-request', {
      groupId,
      thesisTitle,
      status: 'Pending',
      requestedAt: faculty.requestedAt
    });

    return res.status(201).json({
      message: "Faculty clearance started",
      data: faculty
    });

  } catch (err) {
    console.error("❌ Error starting clearance:", err.message);
    return res.status(500).json({
      message: "Failed to start clearance",
      error: err.message
    });
  }
};



// 🔹 Get all pending faculty records
// controller
export const getPendingFaculty = async (req, res) => {
  try {
    const pending = await Faculty.find({ status: 'Pending' })
      .populate({
  path: 'groupId',
  select: 'groupNumber projectTitle members',
  populate: {
    path: 'members',
    model: 'Student', // Explicitly declare the model to ensure population
    select: '_id fullName studentId'
  }
})

      .sort({ requestedAt: 1 }); // ⬅️ First come, first served

    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching faculty requests', error: err.message });
  }
};



// 🔹 Approve faculty clearance
// ✅ Faculty Approval — Group-based logic
export const approveFaculty = async (req, res) => {
  const { groupId } = req.body;
  const actorId = req.user._id;
  const now = new Date();

  try {
    const faculty = await Faculty.findOne({
      groupId: new mongoose.Types.ObjectId(groupId),
    });

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty record not found.' });
    }

    if (
      !faculty.printedThesisSubmitted ||
      !faculty.signedFormSubmitted ||
      !faculty.softCopyReceived ||
      !faculty.supervisorCommentsWereCorrected
    ) {
      return res.status(400).json({
        message: 'Missing required documents or supervisor corrections not done.',
      });
    }

    if (faculty.status === 'Approved') {
      return res.status(400).json({ message: "Faculty already approved." });
    }

    // ✅ Mark as approved
    faculty.status = 'Approved';
    faculty.rejectionReason = '';
    faculty.facultyRemarks = '';
    faculty.clearedAt = now;

    const alreadyApproved = faculty.history.some((h) => h.status === 'Approved');
    if (!alreadyApproved) {
      faculty.history.push({
        status: 'Approved',
        reason: 'All required documents verified and approved',
        actor: actorId,
        date: now,
      });
    }

    await faculty.save();

    // ✅ Update group progress
    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.faculty.status': 'Approved',
          'clearanceProgress.faculty.date': now,
        },
      }
    );

    // ✅ Update student clearances in parallel
    const students = await Student.find({ groupId }).select('_id');

    await Promise.all(students.map(async (s) => {
      let clearance = await Clearance.findOne({ studentId: s._id });

      if (!clearance) {
        clearance = new Clearance({
          studentId: s._id,
          faculty: {
            status: 'Approved',
            clearedAt: now,
            rejectionReason: '',
          },
        });
      } else {
        clearance.faculty.status = 'Approved';
        clearance.faculty.clearedAt = now;
        clearance.faculty.rejectionReason = '';
      }

      return clearance.save();
    }));

    console.log(`✅ Faculty clearance updated for ${students.length} students`);

    // ✅ Create or update library clearance
    let libraryClearance = await Library.findOne({ groupId });

    if (!libraryClearance) {
      libraryClearance = new Library({
        groupId,
        members: students.map((s) => s._id),
        status: 'Pending',
        facultyCleared: true,
        clearedAt: null,
        remarks: '',
        updatedAt: now,
      });
    } else {
      libraryClearance.facultyCleared = true;
      libraryClearance.updatedAt = now;
    }

    await libraryClearance.save();

    // ✅ Emit to Library dashboard
    if (global._io) {
      global._io.emit("library:new-pending", {
        groupId,
        message: "New group ready for Library clearance",
        timestamp: now,
      });
    }

    return res.status(200).json({
      message: '✅ Faculty approved and Library clearance initialized.',
    });
  } catch (err) {
    console.error('❌ Faculty approval error:', err);
    return res.status(500).json({
      message: 'Approval failed.',
      error: err.message,
    });
  }
};

// 🔹 Reject faculty clearance
export const rejectFaculty = async (req, res) => {
  const { groupId, rejectionReason } = req.body;
    const actorId = req.user._id;


  try {
    const faculty = await Faculty.findOne({ groupId });
    if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

    faculty.status = 'Rejected';
    faculty.rejectionReason = rejectionReason || 'Not provided';
    faculty.facultyRemarks = rejectionReason || '';
    faculty.clearedAt = null;
    faculty.history.push({
  status: 'Rejected',
  reason: rejectionReason || 'Not provided',
  actor: actorId,
  date: new Date()
});

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

    const students = await Student.find({ groupId }).select('_id');

    for (const s of students) {
      await Clearance.updateOne(
        { studentId: s._id },
        {
          $set: {
            'faculty.status': 'Rejected',
            'faculty.rejectionReason': rejectionReason || 'Not provided',
            'faculty.clearedAt': null
          }
        },
        { upsert: true }
      );
      console.log(`❌ Faculty clearance rejected for student ${s._id}`);
    }

    res.status(200).json({ message: 'Faculty rejected for all group members.' });

  } catch (err) {
    console.error('❌ Faculty rejection error:', err);
    res.status(500).json({ message: 'Rejection failed.', error: err.message });
  }
};


export const markReadyAgain = async (req, res) => {
 const { groupId } = req.body;
const actorId = req.user._id; // safer

  try {
    const faculty = await Faculty.findOne({ groupId });
    if (!faculty) return res.status(404).json({ message: "Faculty record not found." });

    if (faculty.status !== 'Rejected') {
      return res.status(400).json({ message: "Only rejected clearances can be marked ready again." });
    }

    faculty.status = 'Pending';
    faculty.rejectionReason = '';
    faculty.facultyRemarks = '';
    faculty.resubmissionCount += 1;

    faculty.history.push({
      status: 'Pending',
      reason: 'Resubmitted after rejection',
      actor: actorId,
      date: new Date()
    });

    await faculty.save();
    global._io.emit('faculty-resubmission', {
  groupId,
  status: 'Pending',
  resubmissionCount: faculty.resubmissionCount,
  timestamp: new Date(),
});


    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.faculty.status': 'Pending',
          'clearanceProgress.faculty.date': new Date()
        }
      }
    );

    res.status(200).json({ message: "Marked ready again for faculty clearance." });
  } catch (err) {
    console.error("❌ Mark ready error:", err);
    res.status(500).json({ message: "Failed to mark as ready again", error: err.message });
  }
};


// 🔹 Faculty stats
export const getFacultyStatusCount = async (req, res) => {
  try {
    const pending = await Faculty.countDocuments({ status: 'Pending' });
    const approved = await Faculty.countDocuments({ status: 'Approved' });
    const rejected = await Faculty.countDocuments({ status: 'Rejected' });

    res.json({ pending, approved, rejected });
  } catch (err) {
    console.error("Error getting faculty status count:", err.message);
    res.status(500).json({ error: "Failed to fetch status counts" });
  }
};
// 🔹 Update document checklist
//✅ UPDATE Checklist
// ✅ controllers/facultyController.js
export const updateFacultyChecklist = async (req, res) => {
  const { groupId, checklist } = req.body;

  try {
    const faculty = await Faculty.findOne({ groupId });
    if (!faculty) return res.status(404).json({ message: "Faculty record not found" });

    faculty.printedThesisSubmitted = checklist.printedThesisSubmitted;
    faculty.signedFormSubmitted = checklist.signedFormSubmitted;
    faculty.softCopyReceived = checklist.softCopyReceived;
    faculty.supervisorCommentsWereCorrected = checklist.supervisorCommentsWereCorrected;

    await faculty.save();

    res.status(200).json({ message: "Checklist updated successfully" });
  } catch (err) {
    console.error("❌ Checklist update error:", err.message);
    res.status(500).json({ message: "Checklist update failed", error: err.message });
  }
};


// 🔹 Get clearance history for a group (Faculty)
export const getFacultyHistory = async (req, res) => {
  const { groupId } = req.params;

  try {
    const faculty = await Faculty.findOne({ groupId })
      .populate('history.actor', 'fullName role') // Faculty/admin who approved/rejected
      .populate('history.startedBy', 'fullName studentId'); // Student who started the clearance

    if (!faculty) return res.status(404).json({ message: "Faculty record not found" });

    res.status(200).json({ history: faculty.history });
  } catch (err) {
    console.error("❌ Get faculty history error:", err);
    res.status(500).json({ message: "Failed to fetch history", error: err.message });
  }
};




// controllers/facultyController.js
export const getApprovedFacultyGroups = async (req, res) => {
  try {
    const approved = await Faculty.find({ status: "Approved" })
      .populate({
        path: 'groupId',
        select: 'groupNumber projectTitle admissionYear members',
        populate: {
          path: 'members',
          select: 'fullName studentId status program mode class status',
        }
      });

    res.status(200).json(approved);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch approved groups", error: err.message });
  }
};


export const getRejectedFacultyGroups = async (req, res) => {
  try {
    const rejected = await Faculty.find({ status: "Rejected" })
      .populate({
        path: 'groupId',
        select: 'groupNumber projectTitle admissionYear members',
        populate: {
          path: 'members',
          select: 'fullName studentId program mode class status'
        }
      });

    res.status(200).json(rejected);
  } catch (err) {
    console.error("❌ Failed to fetch rejected faculty groups:", err.message);
    res.status(500).json({ message: "Failed to fetch rejected faculty groups", error: err.message });
  }
};



export const getMyGroupFaculty = async (req, res) => {
  try {
    console.log(`📥 getMyGroupFaculty called by student: ${req.user?._id}`);

    const student = await Student.findById(req.user._id).populate('groupId');
    if (!student) {
      console.warn("❌ Student not found for the provided token.");
      return res.status(404).json({ ok: false, message: "Student not found" });
    }

    if (!student.groupId) {
      console.warn("❌ Student has no group assigned.");
      return res.status(200).json({ ok: false, message: "Student is not assigned to any group" });
    }

    const facultyRecord = await Faculty.findOne({ groupId: student.groupId._id });

    console.log(`📘 Faculty record status for group ${student.groupId._id}: ${facultyRecord?.status || "NO RECORD"}`);

    if (!facultyRecord) {
      return res.status(200).json({
        ok: false,
        message: "No faculty clearance process has been initiated for this group",
      });
    }

    return res.status(200).json({
      ok: true,
      status: facultyRecord.status, // "Pending" | "Approved" | "Rejected"
      rejectionReason: facultyRecord.rejectionReason || "",
      facultyRemarks: facultyRecord.facultyRemarks || "",
    });

  } catch (err) {
    console.error("❌ Error in getMyGroupFaculty:", err.message);
    return res.status(500).json({
      ok: false,
      message: "Failed to retrieve faculty clearance status",
      error: err.message,
    });
  }
};
