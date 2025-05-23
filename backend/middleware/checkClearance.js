import Clearance from '../models/Clearance.js';

const checkClearance = async (req, res, next) => {
  const studentId = req.body.studentId || req.params.studentId;

  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  try {
    const clearance = await Clearance.findOne({ studentId });

    if (!clearance) {
      return res.status(404).json({ error: "Clearance record not found" });
    }

    const facultyApproved = clearance.faculty?.status === 'Approved';
    const libraryApproved = clearance.library?.status === 'Approved';
    const labApproved = clearance.lab?.status === 'Approved';

    if (!facultyApproved || !libraryApproved || !labApproved) {
      return res.status(403).json({
        error: "Access denied. Student has not cleared all prerequisite departments (Faculty, Library, Lab)."
      });
    }

    next(); // all clearances approved, proceed

  } catch (error) {
    console.error("Clearance check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default checkClearance;
