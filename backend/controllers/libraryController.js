import User from '../models/User.js';       // unified user model
import Library from '../models/library.js';
import Clearance from '../models/Clearance.js';
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
      select: 'groupNumber program faculty',
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

    res.status(200).json({ message: 'Library approved and Lab clearance initialized.' });

  } catch (err) {
    console.error("❌ Library approval error:", err);
    res.status(500).json({ message: 'Approval failed.', error: err.message });
  }
};

/// 🔹 Reject library clearance
export const rejectLibrary = async (req, res) => {
  const { groupId, remarks } = req.body;
  try {
    // 1. Find the Library record
    const library = await Library.findOne({ groupId });
    if (!library) return res.status(404).json({ message: 'Library record not found.' });

    // 2. Update the Library record
    library.status = 'Rejected';
    library.remarks = remarks || 'No remarks';
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
      .populate('groupId', 'groupNumber program faculty')
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

// export const fixLibraryFlags = async (req, res) => {
//   try {
//     const result = await Library.updateMany(
//       { status: "Pending", facultyCleared: false },
//       { $set: { facultyCleared: true } }
//     );
//     console.log(`✅ Fixed ${result.modifiedCount} library records`);

//     res.status(200).json({ message: "Library flags fixed", updated: result.modifiedCount });
//   } catch (err) {
//     console.error("❌ Failed to fix library flags:", err);
//     res.status(500).json({ message: "Fix failed", error: err.message });
//   }
// };