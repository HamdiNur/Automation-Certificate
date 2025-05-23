// ✅ backend/controllers/labController.js — Full Lab Logic

import Lab from '../models/lab.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import Clearance from '../models/Clearance.js';
import Finance from '../models/finance.js';  // ✅ ADD THIS LINE
import { generateFinanceForStudent } from '../utils/financeGenerator.js';


// 🔹 Get all lab clearance records
export const getAllLabClearances = async (req, res) => {
  try {
    const records = await Lab.find()
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId email');
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab records', message: err.message });
  }
};

// 🔹 Get lab record by group ID
export const getLabByGroupId = async (req, res) => {
  try {
    const record = await Lab.findOne({ groupId: req.params.groupId })
      .populate('groupId', 'groupNumber program')
      .populate('members', 'fullName studentId email');
    if (!record) return res.status(404).json({ message: 'Lab clearance not found for this group.' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching lab record by group ID', message: err.message });
  }
};

// 🔹 Get lab clearance for a specific student
export const getLabByStudentId = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const record = await Lab.findOne({ members: studentId })
      .populate('groupId', 'groupNumber program faculty')
      .populate('members', 'fullName studentId email');

    if (!record) return res.status(404).json({ message: 'Lab clearance not found for this student.' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab record', message: err.message });
  }
};

// 🔹 Get only pending lab records
export const getPendingLab = async (req, res) => {
  try {
    const records = await Lab.find({ status: 'Pending' })
      .populate('groupId', 'groupNumber program')
      .populate('members', 'fullName studentId email');
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending records', message: err.message });
  }
};

// 🔹 Approve lab clearance
export const approveLab = async (req, res) => {
  try {
    const { groupId, approvedBy, returnedItems, issues } = req.body;

    // 🔍 Find the lab record
    const record = await Lab.findOne({ groupId });
    if (!record) return res.status(404).json({ message: 'Lab record not found' });

    // ✅ Approve lab
    record.status = 'Approved';
    record.clearedAt = new Date();
    record.approvedBy = approvedBy || 'System';
    record.returnedItems = returnedItems || 'All items returned';
    record.issues = issues || 'None';
    await record.save();

    // ✅ Update group clearance progress
    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.lab.status': 'Approved',
          'clearanceProgress.lab.date': new Date()
        }
      }
    );

    // 🔄 Fetch group members (students)
    const students = await Student.find({ groupId }).select('_id');

    for (const student of students) {
      // 🔁 Update or create clearance record
      let clearance = await Clearance.findOne({ studentId: student._id });

      if (!clearance) {
        clearance = new Clearance({
          studentId: student._id,
          lab: {
            status: 'Approved',
            clearedAt: new Date()
          }
        });
      } else {
        clearance.lab.status = 'Approved';
        clearance.lab.clearedAt = new Date();
      }

      await clearance.save();
    }

    // 🔍 Check if students are now eligible for finance phase
    for (const student of students) {
      const clearance = await Clearance.findOne({ studentId: student._id });

      const allPhaseOneCleared =
        clearance?.faculty?.status === 'Approved' &&
        clearance?.library?.status === 'Approved' &&
        clearance?.lab?.status === 'Approved';

      if (allPhaseOneCleared) {
        // 🧹 Delete any existing finance records
        await Finance.deleteMany({ studentId: student._id });

        // 🔁 Generate fresh finance records
        await generateFinanceForStudent(student._id);

        // ✅ Update finance phase in clearance
        await Clearance.updateOne(
          { studentId: student._id },
          {
            $set: {
              'finance.eligibleForFinance': true,
              'finance.status': 'Pending'
            }
          }
        );

        console.log(`✅ Finance regenerated for ${student._id}`);
      }
    }

    res.status(200).json({ message: 'Lab approved and finance initialized for eligible students.' });

  } catch (err) {
    console.error("❌ Lab approval error:", err);
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
};
// 🔹 Reject lab clearance
// 🔹 Reject lab clearance
export const rejectLab = async (req, res) => {
  try {
    const { groupId, issues } = req.body;

    // 1. Find the Lab record
    const record = await Lab.findOne({ groupId });
    if (!record) return res.status(404).json({ message: 'Lab record not found' });

    // 2. Update Lab record
    record.status = 'Rejected';
    record.issues = issues || 'Unspecified';
    record.clearedAt = null;
    await record.save();

    // 3. Update Group progress
    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.lab.status': 'Rejected',
          'clearanceProgress.lab.date': new Date()
        }
      }
    );

    // 4. Get students in the group
    const students = await Student.find({ groupId }).select('_id');

    // 5. Update each student's clearance record
    for (const student of students) {
      const clearance = await Clearance.findOne({ studentId: student._id });
      if (clearance) {
        clearance.lab.status = 'Rejected';
        clearance.lab.clearedAt = null;
        await clearance.save();
        console.log(`❌ Lab clearance rejected for student: ${student._id}`);
      }
    }

    res.status(200).json({ message: 'Lab record rejected and student clearances updated.' });
  } catch (err) {
    console.error("❌ Lab rejection error:", err);
    res.status(500).json({ error: 'Rejection failed', message: err.message });
  }
};

// 🔹 Get counts of lab clearance statuses
export const getLabStats = async (req, res) => {
  try {
    const approved = await Lab.countDocuments({ status: 'Approved' });
    const pending = await Lab.countDocuments({ status: 'Pending' });
    const rejected = await Lab.countDocuments({ status: 'Rejected' });

    res.status(200).json({ approved, pending, rejected });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab stats', message: err.message });
  }
}

export const getLabProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assume token verification middleware sets req.user
    const profile = await Lab.findById(userId);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
};