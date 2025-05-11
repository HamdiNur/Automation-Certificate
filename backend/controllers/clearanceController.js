import Clearance from '../models/Clearance.js';
export const getStudentClearance = async (req, res) => {
  const { studentId } = req.params;
  try {
    const clearance = await Clearance.findOne({ studentId });
    if (!clearance) return res.status(404).json({ message: 'Clearance record not found' });
    res.status(200).json(clearance);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch clearance record', error: err.message });
  }
};