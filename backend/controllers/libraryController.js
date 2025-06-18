import User from '../models/User.js';       // unified user model
import Library from '../models/library.js';
import Clearance from '../models/clearance.js';
import Group from '../models/group.js';
import Lab from '../models/lab.js';          // lab clearance model
import Student from '../models/Student.js'; // student model

// 🔹 Get all pending library records
export const getPendingLibrary = async (req, res) => {
  try {
    const pending = await Library.find({
      status: 'Pending',
      facultyCleared: true
    })
    .populate({
      path: 'members',
      select: 'fullName studentId email',
      model: 'Student'
    })
.populate({
  path: 'groupId',
  select: 'groupNumber program faculty projectTitle', // ✅ add this
  model: 'Group'
});


    console.log("📦 Raw Pending Records Found:", pending.length);
    console.log("📦 Sample:", pending.map(p => ({
      groupId: p.groupId,
      groupNumber: p.groupId?.groupNumber,
      members: p.members?.length
    })));

    res.status(200).json(pending);
  } catch (err) {
    console.error("Error fetching library clearance:", err);
    res.status(500).json({ message: 'Error fetching library clearance.', error: err.message });
  }
};


// 🔹 Approve library clearance

export const approveLibrary = async (req, res) => {
  const { groupId, libraryStaffId } = req.body;

  try {
    // 1. Validate staff user
    const staffUser = await User.findOne({ 
      userId: libraryStaffId, 
      role: { $in: ['staff', 'library'] } 
    });
    if (!staffUser) {
      return res.status(404).json({ message: 'Library staff not found' });
    }

    // 2. Find and approve Library record
    const libraryRecord = await Library.findOne({ groupId });
    if (!libraryRecord) {
      return res.status(404).json({ message: 'Library record not found' });
    }

    libraryRecord.status = 'Approved';
    libraryRecord.thesisBookReveiced = true;
    libraryRecord.thesisBookReceivedDate = new Date();
    libraryRecord.libraryStaffId = staffUser._id;
    libraryRecord.clearedAt = new Date();

        // ✅ Add this block BEFORE saving
    libraryRecord.history = libraryRecord.history || [];
    libraryRecord.history.push({
      status: 'Approved',
      reason: 'Thesis book received',
      actor: staffUser._id,
      date: new Date()
    });
    await libraryRecord.save();

    // 3. Update Group clearance progress
    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.library.status': 'Approved',
          'clearanceProgress.library.date': new Date()
        }
      }
    );

    // 4. Update each student's Clearance record
    const students = await Student.find({ groupId }).select('_id');
    for (const s of students) {
      let clearance = await Clearance.findOne({ studentId: s._id });
      if (!clearance) {
        clearance = new Clearance({
          studentId: s._id,
          library: {
            status: 'Approved',
            clearedAt: new Date()
          }
        });
      } else {
        clearance.library.status = 'Approved';
        clearance.library.clearedAt = new Date();
      }
      
      await clearance.save();
    }

    // 5. Initialize or reset Lab clearance
    let labClearance = await Lab.findOne({ groupId });
    if (!labClearance) {
      labClearance = new Lab({
        groupId,
        members: students.map(s => s._id),
        status: 'Pending',
        clearedAt: null,
        issues: '',
        returnedItems: '',
        updatedAt: new Date()
      });
    } else {
      labClearance.status = 'Pending';
      labClearance.clearedAt = null;
      labClearance.issues = '';
      labClearance.returnedItems = '';
      labClearance.updatedAt = new Date();
    }
    

    await labClearance.save();
    
// ✅ Emit socket to Lab if Faculty already approved
const firstStudent = await Student.findOne({ groupId }).select('_id');
const clearance = await Clearance.findOne({ studentId: firstStudent._id });

if (clearance?.faculty?.status === 'Approved') {
  if (global._io) {
    global._io.emit('lab:new-eligible', {
      groupId,
      message: "✅ Group is now eligible for Lab clearance",
      timestamp: new Date()
    });
    console.log("📢 Emitted lab:new-eligible socket for group:", groupId);
  }
}

// ✅ Final response
res.status(200).json({ message: 'Library approved and Lab clearance initialized.' });


  } catch (err) {
    console.error("❌ Library approval error:", err);
    res.status(500).json({ message: 'Approval failed.', error: err.message });
  }
};

/// 🔹 Reject library clearance
export const rejectLibrary = async (req, res) => {
  const { groupId, remarks } = req.body;
const { libraryStaffId } = req.body;

const staffUser = await User.findOne({ userId: libraryStaffId });
if (!staffUser) return res.status(404).json({ message: "Library staff not found." });

const actorId = staffUser._id;

  try {
    // 1. Find the Library record
    const library = await Library.findOne({ groupId });
    if (!library) return res.status(404).json({ message: 'Library record not found.' });

    // 2. Update the Library record
    library.status = 'Rejected';
    library.remarks = remarks || 'No remarks';

        // ✅ Add rejection to history
    library.history = library.history || [];
    library.history.push({
      status: 'Rejected',
      reason: remarks || 'No remarks provided',
      actor: actorId || null,
      date: new Date()
    });
    await library.save();

    // 3. Get all students in the group
    const students = await Student.find({ groupId }).select('_id');

    // 4. Update their Clearance records
    for (const s of students) {
      const clearance = await Clearance.findOne({ studentId: s._id });

      if (clearance) {
        clearance.library.status = 'Rejected';
        clearance.library.clearedAt = null;
        await clearance.save();
        console.log(`📌 Rejected library clearance for student: ${s._id}`);
      }
    }

    res.status(200).json({ message: 'Library rejected and student clearances updated.' });
  } catch (err) {
    console.error("❌ Library rejection error:", err);
    res.status(500).json({ message: 'Rejection failed.', error: err.message });
  }
};


// 🔹 Get all library clearance records
export const getAllLibraryClearances = async (req, res) => {
  try {
    const records = await Library.find()
      .populate('groupId', 'groupNumber program faculty projectTitle')
      .populate('members', 'fullName studentId email');
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch library clearances', message: err.message });
  }
};

// 🔹 Get library record by group ID
export const getLibraryByGroupId = async (req, res) => {
  try {
    const record = await Library.findOne({ groupId: req.params.groupId })
      .populate('groupId', 'groupNumber program')
      .populate('members', 'fullName studentId email');
    if (!record) return res.status(404).json({ message: 'Library clearance not found for this group.' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching record by group ID', message: err.message });
  }
};

// 🔹 Update library clearance status
export const updateLibraryStatus = async (req, res) => {
  try {
    const { groupId, status, remarks } = req.body;
    const record = await Library.findOne({ groupId });
    if (!record) return res.status(404).json({ message: 'Library record not found' });

    record.status = status || record.status;
    record.remarks = remarks || record.remarks;
    if (status === 'Approved') {
      record.clearedAt = new Date();
    }
    await record.save();

    res.status(200).json({ message: 'Library status updated', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update library clearance', message: err.message });
  }
};

// 🔹 Get library clearance for a specific student
export const getLibraryByStudentId = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const record = await Library.findOne({ members: studentId })
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId email');

    if (!record) {
      return res.status(404).json({ message: 'No library clearance found for this student.' });
    }

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch library record', message: err.message });
  }
};

export const getLibraryStats = async (req, res) => {
  try {
    const pending = await Library.countDocuments({ status: "Pending" });
    const approved = await Library.countDocuments({ status: "Approved" });
    const rejected = await Library.countDocuments({ status: "Rejected" });

    res.status(200).json({ pending, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch library stats", error: err.message });
  }
};

// ✅ Resubmit Library Clearance — markReadyAgain
export const markLibraryReadyAgain = async (req, res) => {
  const { groupId } = req.body;
  const actorId = req.user._id;

  try {
    const library = await Library.findOne({ groupId });
    if (!library) return res.status(404).json({ message: "Library record not found." });

    if (library.status !== "Rejected") {
      return res.status(400).json({ message: "Only rejected library clearances can be resubmitted." });
    }

    // Reset status
    library.status = "Pending";
    library.remarks = "";
    library.thesisBookReveiced = false;
    library.thesisBookReceivedDate = null;
    library.clearedAt = null;

    // Add history record (initialize if missing)
    if (!Array.isArray(library.history)) {
      library.history = [];
    }

    library.history.push({
      status: "Pending",
      actor: actorId,
      reason: "Resubmission after rejection",
      date: new Date()
    });

    await library.save();

    // Update Group clearanceProgress
    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          "clearanceProgress.library.status": "Pending",
          "clearanceProgress.library.date": new Date()
        }
      }
    );

    return res.status(200).json({ message: "Library marked ready again." });

  } catch (err) {
    console.error("❌ markReadyAgain error:", err);
    return res.status(500).json({ message: "Resubmission failed", error: err.message });
  }
};


// ✅ View library clearance history
export const getLibraryHistory = async (req, res) => {
  const { groupId } = req.params;

  try {
    const library = await Library.findOne({ groupId })
      .populate('history.actor', 'fullName role');

    if (!library) return res.status(404).json({ message: "Library record not found" });

    return res.status(200).json({ history: library.history || [] });
  } catch (err) {
    console.error("❌ Error fetching library history:", err);
    res.status(500).json({ message: "Failed to fetch history", error: err.message });
  }
};



export const getMyGroupLibrary = async (req, res) => {
  try {
    console.log(`📥 getMyGroupLibrary called by: ${req.user?.id || req.user?.studentId}`);

    // 1️⃣ Try to find the student by either Mongo _id or studentId
    let student = null;

    if (req.user.id) {
      student = await Student.findById(req.user.id).populate('groupId');
    }
    if (!student && req.user.studentId) {
      student = await Student.findOne({ studentId: req.user.studentId }).populate('groupId');
    }

    if (!student) {
      console.warn("❌ Student not found.");
      return res.status(404).json({ ok: false, message: "Student not found" });
    }

    if (!student.groupId) {
      console.warn("⚠️ Student is not assigned to any group.");
      return res.status(404).json({ ok: false, message: "Student not assigned to a group" });
    }

    // 2️⃣ Find library clearance for the student's group
    const libraryRecord = await Library.findOne({ groupId: student.groupId._id });

    if (!libraryRecord) {
      console.info("ℹ️ No library record started for this group.");
      return res.status(200).json({
        ok: false,
        message: "No library clearance has been started for this group",
      });
    }

    // 3️⃣ Respond with library status and remarks
    return res.status(200).json({
      ok: true,
      status: libraryRecord.status,          // "Pending" | "Approved" | "Rejected"
      remarks: libraryRecord.remarks || "",
    });

  } catch (err) {
    console.error("❌ Error in getMyGroupLibrary:", err.message);
    return res.status(500).json({
      ok: false,
      message: "Failed to retrieve your group’s library clearance status",
      error: err.message,
    });
  }
};
