// import Faculty from '../models/faculty.js';
// import Clearance from '../models/Clearance.js';
// import Group from '../models/group.js';
// import Student from '../models/Student.js';
// import Library from '../models/library.js';


// // 🔹 Get all pending faculty records
// export const getPendingFaculty = async (req, res) => {
//   try {
//     const pending = await Faculty.find({ status: 'Pending' })
//       .populate('studentId', 'fullName studentId program faculty')
//       .populate('groupId', 'groupNumber projectTitle');

//     res.status(200).json(pending);
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching faculty clearance.', error: err.message });
//   }
// };

// // 🔹 Approve faculty clearance
// // 🔹 Approve faculty clearance
// export const approveFaculty = async (req, res) => {
//   const { studentId, groupId } = req.body;

//   try {
//     // 1. Find the student by their studentId string
//     const student = await Student.findOne({ studentId });
//     if (!student) return res.status(404).json({ message: 'Student not found.' });

//     // 2. Find the faculty clearance record
//     const faculty = await Faculty.findOne({ studentId: student._id });
//     if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

//     // 3. Check required documents
//     if (!faculty.printedThesisSubmitted || !faculty.signedFormSubmitted || !faculty.softCopyReceived) {
//       return res.status(400).json({ message: 'Missing required documents.' });
//     }

//     // 4. Approve faculty
//     faculty.status = 'Approved';
//     faculty.rejectionReason = '';
//     faculty.facultyRemarks = '';
//     faculty.clearedAt = new Date();
//     await faculty.save();

//     // 5. Update Group progress
//     await Group.updateOne(
//       { _id: groupId },
//       {
//         $set: {
//           'clearanceProgress.faculty.status': 'Approved',
//           'clearanceProgress.faculty.date': new Date()
//         }
//       }
//     );

//     //// ✅ 6. Fetch all students in the group
// const students = await Student.find({ groupId }).select('_id');

// // ✅ 7. Update or create Clearance record per student
// for (const s of students) {
//   let clearance = await Clearance.findOne({ studentId: s._id });

//   if (!clearance) {
//     clearance = new Clearance({
//       studentId: s._id,
//       faculty: {
//         status: 'Approved',
//         clearedAt: new Date(),
//         rejectionReason: ''
//       }
//     });
//   } else {
//     clearance.faculty.status = 'Approved';
//     clearance.faculty.clearedAt = new Date();
//     clearance.faculty.rejectionReason = '';
//   }

//   await clearance.save();
// }

// // ✅ 8. Update Library collection to mark facultyCleared = true
// await Library.updateOne(
//   { groupId },
//   { $set: { facultyCleared: true } }
// );

// // ✅ 9. Create or update Library record for group
// let libraryClearance = await Library.findOne({ groupId });

// if (!libraryClearance) {
//   libraryClearance = new Library({
//     groupId,
//     members: students.map(s => s._id),
//     status: 'Pending',
//     facultyCleared: true,
//     clearedAt: null,
//     remarks: '',
//     updatedAt: new Date()
//   });
// } else {
//   libraryClearance.facultyCleared = true;
//   libraryClearance.updatedAt = new Date();
// }

// await libraryClearance.save();

//     res.status(200).json({ message: 'Faculty approved and Library clearance initialized.' });

//   } catch (err) {
//     console.error('❌ Faculty approval error:', err);
//     res.status(500).json({ message: 'Approval failed.', error: err.message });
//   }
// };



// // 🔹 Reject faculty clearance
// export const rejectFaculty = async (req, res) => {
//   const { studentId, groupId, rejectionReason } = req.body;

//   try {
//     const faculty = await Faculty.findOne({ studentId });
//     if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

//     faculty.status = 'Rejected';
//     faculty.rejectionReason = rejectionReason || 'Not provided';
//     faculty.facultyRemarks = rejectionReason || '';
//     faculty.clearedAt = null;
//     await faculty.save();

//     await Group.updateOne(
//       { _id: groupId },
//       {
//         $set: {
//           'clearanceProgress.faculty.status': 'Rejected',
//           'clearanceProgress.faculty.date': new Date()
//         }
//       }
//     );

//     await Clearance.updateOne(
//       { studentId },
//       {
//         $set: {
//           'faculty.status': 'Rejected',
//           'faculty.rejectionReason': rejectionReason || 'Not provided',
//           'faculty.clearedAt': null
//         }
//       }
//     );

//     res.status(200).json({ message: 'Faculty rejected.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Rejection failed.', error: err.message });
//   }
// };


// export const getFacultyStats = async (req, res) => {
//   try {
//     const pending = await Faculty.countDocuments({ status: "Pending" });
//     const approved = await Faculty.countDocuments({ status: "Approved" });
//     const rejected = await Faculty.countDocuments({ status: "Rejected" });

//     res.status(200).json({ pending, approved, rejected });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch faculty stats", error: err.message });
//   }
// };

// // 🔹 Update document checklist before approval
// export const updateFacultyChecklist = async (req, res) => {
//   const { studentId, checklist } = req.body;

//   try {
//     const student = await Student.findOne({ studentId });
//     if (!student) return res.status(404).json({ message: "Student not found" });

//     await Faculty.updateOne(
//       { studentId: student._id },
//       { $set: checklist }
//     );

//     res.status(200).json({ message: "Checklist updated" });
//   } catch (err) {
//     res.status(500).json({ message: "Checklist update failed", error: err.message });
//   }
// };





import Faculty from '../models/faculty.js';
import Clearance from '../models/Clearance.js';
import Group from '../models/group.js';
import Student from '../models/Student.js';
import Library from '../models/library.js';

// 🔹 Get all pending faculty records
export const getPendingFaculty = async (req, res) => {
  try {
    const pending = await Faculty.find({ status: 'Pending' })
      .populate('studentId', 'fullName studentId program faculty')
      .populate('groupId', 'groupNumber projectTitle');

    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching faculty clearance.', error: err.message });
  }
};

// 🔹 Approve faculty clearance
export const approveFaculty = async (req, res) => {
  const { studentId, groupId } = req.body;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const faculty = await Faculty.findOne({ studentId: student._id });
    if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

    if (!faculty.printedThesisSubmitted || !faculty.signedFormSubmitted || !faculty.softCopyReceived) {
      return res.status(400).json({ message: 'Missing required documents.' });
    }

    faculty.status = 'Approved';
    faculty.rejectionReason = '';
    faculty.facultyRemarks = '';
    faculty.clearedAt = new Date();
    await faculty.save();

    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          'clearanceProgress.faculty.status': 'Approved',
          'clearanceProgress.faculty.date': new Date()
        }
      }
    );

    const students = await Student.find({ groupId }).select('_id');

    for (const s of students) {
      let clearance = await Clearance.findOne({ studentId: s._id });

      if (!clearance) {
        clearance = new Clearance({
          studentId: s._id,
          faculty: {
            status: 'Approved',
            clearedAt: new Date(),
            rejectionReason: ''
          }
        });
      } else {
        clearance.faculty.status = 'Approved';
        clearance.faculty.clearedAt = new Date();
        clearance.faculty.rejectionReason = '';
      }

      await clearance.save();
      console.log(`✅ Clearance saved for student ${s._id}`);
    }

    await Library.updateOne(
      { groupId },
      { $set: { facultyCleared: true } }
    );

    let libraryClearance = await Library.findOne({ groupId });

    if (!libraryClearance) {
      libraryClearance = new Library({
        groupId,
        members: students.map(s => s._id),
        status: 'Pending',
        facultyCleared: true,
        clearedAt: null,
        remarks: '',
        updatedAt: new Date()
      });
    } else {
      libraryClearance.facultyCleared = true;
      libraryClearance.updatedAt = new Date();
    }

    await libraryClearance.save();

    res.status(200).json({ message: 'Faculty approved and Library clearance initialized.' });

  } catch (err) {
    console.error('❌ Faculty approval error:', err);
    res.status(500).json({ message: 'Approval failed.', error: err.message });
  }
};

// 🔹 Reject faculty clearance
export const rejectFaculty = async (req, res) => {
  const { studentId, groupId, rejectionReason } = req.body;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const faculty = await Faculty.findOne({ studentId: student._id });
    if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

    faculty.status = 'Rejected';
    faculty.rejectionReason = rejectionReason || 'Not provided';
    faculty.facultyRemarks = rejectionReason || '';
    faculty.clearedAt = null;
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

    await Clearance.updateOne(
      { studentId: student._id },
      {
        $set: {
          'faculty.status': 'Rejected',
          'faculty.rejectionReason': rejectionReason || 'Not provided',
          'faculty.clearedAt': null
        }
      }
    );

    console.log(`❌ Clearance marked as rejected for ${student._id}`);

    res.status(200).json({ message: 'Faculty rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed.', error: err.message });
  }
};

// 🔹 Faculty stats
export const getFacultyStats = async (req, res) => {
  try {
    const pending = await Faculty.countDocuments({ status: "Pending" });
    const approved = await Faculty.countDocuments({ status: "Approved" });
    const rejected = await Faculty.countDocuments({ status: "Rejected" });

    res.status(200).json({ pending, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch faculty stats", error: err.message });
  }
};

// 🔹 Update document checklist
export const updateFacultyChecklist = async (req, res) => {
  const { studentId, checklist } = req.body;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Faculty.updateOne(
      { studentId: student._id },
      { $set: checklist }
    );

    res.status(200).json({ message: "Checklist updated" });
  } catch (err) {
    res.status(500).json({ message: "Checklist update failed", error: err.message });
  }
};
