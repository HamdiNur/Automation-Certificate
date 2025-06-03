// ✅ backend/controllers/groupController.js — Full group controller

import Group from '../models/group.js';
import Faculty from '../models/faculty.js';

import Student from '../models/Student.js';
// 🔹 Get all groups with member names, student IDs, and emails
export const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'fullName studentId email')
      .sort({ groupNumber: 1 });

      const formattedGroups = groups.map(group => ({
        _id: group._id,  // ✅ add this line!
        groupNumber: group.groupNumber,
        program: group.program,
        faculty: group.faculty,
        projectTitle: group.projectTitle,
        clearanceProgress: group.clearanceProgress,
        overallStatus: group.overallStatus,
        members: group.members.map(m => ({
          fullName: m.fullName,
          studentId: m.studentId,
          email: m.email
        }))
      }));

    res.status(200).json(formattedGroups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups', message: err.message });
  }
};

// 🔹 Get a specific group by ID
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'fullName studentId email');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group', message: err.message });
  }
};

export const updateClearanceProgress = async (req, res) => {
  try {
    console.log('🔥 Incoming body:', req.body); // Add this line

    const { groupId, type, status } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!['faculty', 'library', 'lab'].includes(type)) {
      return res.status(400).json({ message: 'Invalid clearance type' });
    }

    group.clearanceProgress[type].status = status;
    group.markModified('clearanceProgress');
    await group.save();

    res.status(200).json({ message: `${type} clearance updated`, group });
  } catch (err) {
    console.error('❌ Update error:', err.message);
    res.status(500).json({ error: 'Failed to update clearance progress', message: err.message });
  }
};

// 🔹 Get group by groupNumber
export const getGroupByNumber = async (req, res) => {
  try {
    const group = await Group.findOne({ groupNumber: req.params.groupNumber }).populate('members', 'fullName studentId email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group by number', message: err.message });
  }
};

export const getGroupsByClearanceStatus = async (req, res) => {
  try {
    const { type, status } = req.params;
    if (!['faculty', 'library', 'lab'].includes(type)) {
      return res.status(400).json({ message: 'Invalid clearance type' });
    }

    const groups = await Group.find({ [`clearanceProgress.${type}.status`]: status })
      .populate('members', 'fullName studentId email');

    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to filter groups', message: err.message });
  }
};
export const getGroupStatusCount = async (req, res) => {
  try {
    const pending = await Group.countDocuments({ "clearanceProgress.faculty.status": "Pending" });
    const approved = await Group.countDocuments({ "clearanceProgress.faculty.status": "Approved" }); // ✅ fixed
    const rejected = await Group.countDocuments({ "clearanceProgress.faculty.status": "Rejected" });

    res.status(200).json({ pending, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch status count", error: err.message });
  }
};


export const updateClearanceStatus = async (req, res) => {
  const { groupId, type, status, facultyRemarks } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    group.clearanceProgress[type].status = status;
    group.clearanceProgress[type].date = new Date();

    if (status === "Rejected" && type === "faculty") {
      group.clearanceProgress[type].facultyRemarks = facultyRemarks || "No reason provided";
    }

    await group.save();

    if (type === "faculty") {
      await Faculty.updateMany(
        { groupId },
        {
          $set: {
            status,
            updatedAt: new Date(),
            ...(status === "Rejected" && {
              facultyRemarks: facultyRemarks || "No reason provided",
              rejectionReason: facultyRemarks || "No reason provided",
            }),
            ...(status === "Approved" && {
              facultyRemarks: '',
              rejectionReason: '',
              clearedAt: new Date(),
            }),
          },
        }
      );
    }

    return res.status(200).json({ message: `Clearance ${status}` });
  } catch (err) {
    console.error("❌ Clearance update error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// controllers/groupController.js
export const getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate({
      path: 'members.student',          // Populate the 'student' inside each member
      model: 'Student',
      select: 'studentId fullName role mode status studentClass',  // Added studentClass here
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Map members to include populated student details alongside the role stored in members
    const formattedMembers = group.members.map((m) => ({
      _id: m._id,
      role: m.role,                     // role from members array
      studentId: m.student?.studentId || '',   // student fields from populated student doc
      fullName: m.student?.fullName || '',
      mode: m.student?.mode || '',
      status: m.student?.status || '',
      studentClass: m.student?.studentClass || '',  // Added studentClass field here
    }));

    res.json({
      groupNumber: group.groupNumber,
      program: group.program,
      projectTitle: group.projectTitle,
            clearanceProgress: group.clearanceProgress, // ✅ Add this line

      members: formattedMembers,
    });
  } catch (error) {
    console.error('Failed to fetch group members:', error.message);
    res.status(500).json({ message: 'Failed to fetch group members', error: error.message });
  }
};

export const getGroupMembersByNumber = async (req, res) => {
  try {
    const group = await Group.findOne({ groupNumber: req.params.groupNumber }).populate({
      path: 'members.student',
      model: 'Student',
      select: 'studentId fullName role mode status studentClass',
    });

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const facultyRecord = await Faculty.findOne({ groupId: group._id });

    const formattedMembers = group.members.map((m) => ({
      _id: m._id,
      role: m.role,
      studentId: m.student?.studentId || '',
      fullName: m.student?.fullName || '',
      mode: m.student?.mode || '',
      status: m.student?.status || '',
      studentClass: m.student?.studentClass || '',
    }));

    res.json({
      groupNumber: group.groupNumber,
      program: group.program,
      projectTitle: group.projectTitle,
      clearanceProgress: {
        faculty: {
          status: facultyRecord?.status || "Not Started" // ✅ important
        }
      },
      members: formattedMembers,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching group by number', error: err.message });
  }
};
