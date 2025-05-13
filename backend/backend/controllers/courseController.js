import CourseRecord from '../models/course.js';
import Student from '../models/Student.js';

// 🔹 Create course records for a student
export const createCourseRecords = async (req, res) => {
  const { studentId, courses } = req.body; // courses = [{ name, code, passed }]

  try {
    const record = await CourseRecord.create({ studentId, courses });
    res.status(201).json({ message: 'Course record created', record });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create record', error: err.message });
  }
};

// 🔹 Update a course status (passed or failed)
export const updateCourseStatus = async (req, res) => {
  const { studentId, courseCode, passed } = req.body;

  try {
    const record = await CourseRecord.findOne({ studentId });
    if (!record) return res.status(404).json({ message: 'Course record not found' });

    const course = record.courses.find(c => c.code === courseCode);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.passed = passed;
    await record.save();

    res.status(200).json({ message: 'Course status updated', record });
  } catch (err) {
    res.status(500).json({ message: 'Error updating course', error: err.message });
  }
};

// 🔹 Get all courses of a student
export const getStudentCourses = async (req, res) => {
  const { studentId } = req.params;

  try {
    const record = await CourseRecord.findOne({ studentId }).populate('studentId');
    if (!record) return res.status(404).json({ message: 'No course records found' });

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch course record', error: err.message });
  }
};

// 🔹 Check if student passed all courses
export const checkGraduationEligibility = async (req, res) => {
  const { studentId } = req.params;

  try {
    const record = await CourseRecord.findOne({ studentId });
    if (!record) return res.status(404).json({ message: 'Course record not found' });

    const failed = record.courses.filter(c => c.passed === false);
    const eligible = failed.length === 0;

    res.status(200).json({
      studentId,
      eligible,
      failedCourses: failed.map(c => c.name)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check eligibility', error: err.message });
  }
};
