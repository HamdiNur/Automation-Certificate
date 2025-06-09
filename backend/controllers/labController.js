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
      .populate('members', 'fullName studentId email')
      .sort({ createdAt: 1 }); // ⬅️

    if (!record) return res.status(404).json({ message: 'Lab clearance not found for this student.' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab record', message: err.message });
  }
};



export const getPendingLab = async (req, res) => {
  try {
    const query = req.query.search?.trim();

    // 1. Fetch all labs with Pending or Incomplete status
    const labs = await Lab.find({ status: { $in: ['Pending', 'Incomplete'] } })
      .populate('groupId', 'groupNumber projectTitle')
      .populate('members', 'fullName studentId');

    // 2. Run clearance lookups in parallel using Promise.all
    const results = await Promise.all(
      labs.map(async (lab) => {
        const student = lab.members[0];
        const clearance = await Clearance.findOne({ studentId: student._id }).lean();

        const facultyCleared = clearance?.faculty?.status === 'Approved';
        const libraryCleared = clearance?.library?.status === 'Approved';

        // Only return lab if both are cleared
        return facultyCleared && libraryCleared ? lab : null;
      })
    );

    // 3. Filter out nulls
    const validLabs = results.filter(Boolean);

    // 4. If query is present, filter again based on group number or student ID
const normalizedQuery = query?.toLowerCase().replace(/\s+/g, "") || "";

const filtered = query
  ? validLabs.filter((lab) => {
      const groupNumber = lab.groupId?.groupNumber?.toString() || "";
      const groupFull = `group${groupNumber}`.toLowerCase().replace(/\s+/g, "");
      const projectTitle = lab.groupId?.projectTitle?.toLowerCase() || "";


      const normalizedGroup = groupNumber.toLowerCase().replace(/\s+/g, "");
    const normalizedGroupFull = `group${normalizedGroup}`;

     const matchExactGroup =
  normalizedQuery === normalizedGroup || // e.g. "2"
  normalizedQuery === normalizedGroupFull || // e.g. "group2"
  normalizedGroupFull.includes(normalizedQuery); // e.g. search: "Group 2"


      const matchProject = projectTitle.includes(normalizedQuery);

      const matchStudent = lab.members.some((m) =>
        `${m.fullName} ${m.studentId}`.toLowerCase().includes(normalizedQuery)
      );

      return matchExactGroup || matchProject || matchStudent;
    })
  : validLabs;


    return res.status(200).json(filtered);
  } catch (err) {
    console.error("❌ Lab pending fetch error:", err);
    return res.status(500).json({ message: 'Error fetching pending lab records', error: err.message });
  }
};

// 🔹 Approve lab clearance
export const approveLab = async (req, res) => {
  try {
    const { groupId, approvedBy, returnedItems, issues } = req.body;

    // 1. Find the Lab record
    const record = await Lab.findOne({ groupId });
    if (!record) {
      return res.status(404).json({ message: 'Lab record not found' });
    }

    // 2. Extract expected items from the Lab document itself (not the group)
    const expected = (record.expectedItems || []).map(i => i.trim().toLowerCase());
const returned =
  Array.isArray(returnedItems)
    ? returnedItems.map(i => i.trim().toLowerCase())
    : (returnedItems || '').split(',').map(i => i.trim().toLowerCase());

    // 3. Compare returned vs expected
    const missingItems = expected.filter(item => !returned.includes(item));

    // 4. Decide status
    if (missingItems.length > 0) {
      record.status = 'Incomplete';
      record.issues = `Missing: ${missingItems.join(', ')}`;
    } else {
      record.status = 'Approved';
      record.issues = issues || 'None';
    }

    record.clearedAt = new Date();
    record.approvedBy = approvedBy || 'System';
    record.returnedItems = returned; // you can use returned.join(',') if you prefer storing as string

    await record.save();

    // 5. Update group clearance progress if fully approved
    if (record.status === 'Approved') {
      await Group.updateOne(
        { _id: groupId },
        {
          $set: {
            'clearanceProgress.lab.status': 'Approved',
            'clearanceProgress.lab.date': new Date()
          }
        }
      );
    }

    // 6. Update or create clearance records for each student
    const students = await Student.find({ groupId }).select('_id');

    for (const student of students) {
      let clearance = await Clearance.findOne({ studentId: student._id });

      if (!clearance) {
        clearance = new Clearance({
          studentId: student._id,
          lab: {
            status: record.status,
            clearedAt: record.clearedAt
          }
        });
      } else {
        clearance.lab.status = record.status;
        clearance.lab.clearedAt = record.clearedAt;
      }

      await clearance.save();
    }

    // 7. If lab is approved and other Phase 1 clearances are approved, generate Finance
    if (record.status === 'Approved') {
      for (const student of students) {
        const clearance = await Clearance.findOne({ studentId: student._id });

        const allPhaseOneCleared =
          clearance?.faculty?.status === 'Approved' &&
          clearance?.library?.status === 'Approved' &&
          clearance?.lab?.status === 'Approved';

        if (allPhaseOneCleared) {
          await Finance.deleteMany({ studentId: student._id });
          await generateFinanceForStudent(student._id);
          await Clearance.updateOne(
            { studentId: student._id },
            {
              $set: {
                'finance.eligibleForFinance': true,
                'finance.status': 'Pending'
              }
            }
          );

          console.log(`✅ Finance initialized for ${student._id}`);
        }
      }
    }

   return res.status(200).json({
  message: record.status === 'Incomplete'
    ? 'Lab marked as incomplete. Returned items were not complete.'
    : 'Lab approved and clearance updated successfully.'
});


  } catch (err) {
    console.error("❌ Lab approval error:", err);
    return res.status(500).json({ message: 'Approval failed', error: err.message });
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
    const allLabs = await Lab.find().select('groupId status members');

    // Run all clearance lookups in parallel
    const results = await Promise.all(
      allLabs.map(async (lab) => {
        const student = lab.members[0]; // any member
        const clearance = await Clearance.findOne({ studentId: student }).lean();

        const facultyCleared = clearance?.faculty?.status === 'Approved';
        const libraryCleared = clearance?.library?.status === 'Approved';

        return {
          status: lab.status,
          isReady: facultyCleared && libraryCleared
        };
      })
    );

    // Tally the results
    let pending = 0, approved = 0, rejected = 0;

    for (const r of results) {
      if (r.status === 'Pending' && r.isReady) pending++;
      else if (r.status === 'Approved') approved++;
      else if (r.status === 'Rejected') rejected++;
    }

    return res.status(200).json({ pending, approved, rejected });
  } catch (err) {
    console.error("❌ getLabStats error:", err);
    return res.status(500).json({ message: "Failed to fetch lab stats", error: err.message });
  }
};


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


// 🔁 Resubmit Lab Clearance after Rejection
export const markLabReadyAgain = async (req, res) => {
  const { groupId } = req.body;
  const actorId = req.user._id;

  try {
    const lab = await Lab.findOne({ groupId });
    if (!lab) return res.status(404).json({ message: "Lab record not found." });

    if (lab.status !== 'Rejected') {
      return res.status(400).json({ message: "Only rejected lab records can be marked ready again." });
    }

    // ✅ Update status to Pending
    lab.status = 'Pending';
    lab.issues = '';
    lab.returnedItems = [];
    lab.clearedAt = null;

    await lab.save();

    // ✅ Update Group progress
    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.lab.status': 'Pending',
          'clearanceProgress.lab.date': new Date()
        }
      }
    );

    // ✅ Update Student Clearances
    const students = await Student.find({ groupId }).select('_id');

    for (const student of students) {
      let clearance = await Clearance.findOne({ studentId: student._id });
      if (!clearance) {
        clearance = new Clearance({
          studentId: student._id,
          lab: {
            status: "Pending",
            clearedAt: null
          }
        });
      } else {
        clearance.lab.status = "Pending";
        clearance.lab.clearedAt = null;
      }
      await clearance.save();
    }

    // Optional: Emit WebSocket if needed
    if (global._io) {
      global._io.emit("lab-resubmission", {
        groupId,
        status: "Pending",
        timestamp: new Date(),
      });
    }

    res.status(200).json({ message: "Lab marked as ready again." });

  } catch (err) {
    console.error("❌ markLabReadyAgain error:", err);
    res.status(500).json({ message: "Failed to mark lab as ready again", error: err.message });
  }
};
