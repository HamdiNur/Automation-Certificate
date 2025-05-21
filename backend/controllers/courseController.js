

import CourseRecord from '../models/course.js';
import Student from '../models/Student.js';

// 🔹 Create multiple course records for a student
export const createCourseRecords = async (req, res) => {
  const { studentId, courses } = req.body; 
  // courses = [{ semester, courseCode, courseName, grade, passed }]

  try {
    const formatted = courses.map(c => ({
      studentId,
      semester: c.semester,
      courseCode: c.courseCode,
      courseName: c.courseName,
      grade: c.grade,
      passed: c.passed
    }));

    const inserted = await CourseRecord.insertMany(formatted);
    res.status(201).json({ message: 'Course records created', inserted });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create records', error: err.message });
  }
};

// 🔹 Update a course's pass/fail status
export const updateCourseStatus = async (req, res) => {
  const { studentId, courseCode, passed } = req.body;

  try {
    const course = await CourseRecord.findOneAndUpdate(
      { studentId, courseCode },
      { passed },
      { new: true }
    );

    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.status(200).json({ message: 'Course status updated', course });
  } catch (err) {
    res.status(500).json({ message: 'Error updating course', error: err.message });
  }
};

// 🔹 Get all courses of a student
// 🔹 Get all courses of a student WITH fullName + readable studentId
export const getStudentCourses = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Get all courses of this student
    const coursesRaw = await CourseRecord.find({ studentId }).lean();

    // Strip studentId from each course to avoid repetition
    const courses = coursesRaw.map(({ studentId, ...course }) => course);

    res.status(200).json({
      student: {
        _id: student._id,
        fullName: student.fullName,
        studentId: student.studentId,
        program: student.program,
        faculty: student.faculty,
        yearOfAdmission: student.yearOfAdmission,
        yearOfGraduation: student.yearOfGraduation
      },
      courses
    });

  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch course record', error: err.message });
  }
};
export const checkEligibility = async (req, res) => {
  const { idOrCode } = req.params;

  try {
    // Try finding by readable studentId (e.g., CA210081)
    let student = await Student.findOne({ studentId: idOrCode });

    // If not found, try as MongoDB _id
    if (!student && idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(idOrCode);
    }

    if (!student) return res.status(404).json({ message: 'Student not found' });

    const records = await CourseRecord.find({ studentId: student._id });

    if (records.length === 0)
      return res.status(404).json({ message: 'No course records found' });

    const failed = records.filter(c => !c.passed);
    const eligible = failed.length === 0;

    res.status(200).json({
      studentId: student.studentId,
      fullName: student.fullName,
      eligible,
      failedCourses: failed.map(c => c.courseName)
    });
  } catch (err) {
    res.status(500).json({ message: 'Eligibility check failed', error: err.message });
  }
};
// 🔹 Get course records for ALL students
export const getAllStudentCourses = async (req, res) => {
  try {
    const students = await Student.find().lean();
    const allRecords = [];

    for (const student of students) {
      const courses = await CourseRecord.find({ studentId: student._id }).lean();
      allRecords.push({
        student: {
          _id: student._id,
          fullName: student.fullName,
          studentId: student.studentId,
          program: student.program,
          faculty: student.faculty
        },
        courses
      });
    }

    res.status(200).json(allRecords);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all student courses', error: err.message });
  }
};

export const getAllPassedStudents = async (req, res) => {
  try {
    const students = await Student.find().lean();
    const passedStudents = [];

    for (const student of students) {
      const hasFailed = await CourseRecord.exists({
        studentId: student._id,
        passed: false
      });

      if (!hasFailed) {
        passedStudents.push({
          studentId: student.studentId,
          fullName: student.fullName,
          email: student.email
        });
      }
    }

    res.status(200).json({
      count: passedStudents.length,
      passedStudents
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch passed students', error: err.message });
  }
};
