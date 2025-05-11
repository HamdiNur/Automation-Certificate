import Group from '../models/group.js';

export const createGroup = async (req, res) => {
  const { groupNumber, program, faculty, projectTitle, thesisFileUrl, members } = req.body;
  try {
    const exists = await Group.findOne({ groupNumber });
    if (exists) return res.status(400).json({ message: 'Group already exists' });

    const group = await Group.create({
      groupNumber,
      program,
      faculty,
      projectTitle,
      thesisFileUrl,
      members
    });

    res.status(201).json({ message: 'Group created', group });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create group', error: err.message });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate('members');
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch groups', error: err.message });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id).populate('members');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch group', error: err.message });
  }
};

export const updateClearanceProgress = async (req, res) => {
  const { groupId, section, status, clearedBy } = req.body;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!['faculty', 'library', 'lab'].includes(section)) {
      return res.status(400).json({ message: 'Invalid clearance section' });
    }

    group.clearanceProgress[section] = {
      status,
      clearedBy,
      date: new Date()
    };

    const allApproved =
      group.clearanceProgress.faculty.status === 'Approved' &&
      group.clearanceProgress.library.status === 'Approved' &&
      group.clearanceProgress.lab.status === 'Approved';

    group.phaseOneCleared = allApproved;
    group.overallStatus = allApproved ? 'Cleared' : 'In Progress';
    group.clearedAt = allApproved ? new Date() : null;

    await group.save();
    res.status(200).json({ message: 'Group clearance updated', group });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};