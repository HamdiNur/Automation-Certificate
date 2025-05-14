// import CourseRecord from '../models/course.js';
// import Student from '../models/Student.js';

// // 🔹 Create course records for a student
// export const createCourseRecords = async (req, res) => {
//   const { studentId, courses } = req.body; // courses = [{ name, code, passed }]

//   try {
//     const record = await CourseRecord.create({ studentId, courses });
//     res.status(201).json({ message: 'Course record created', record });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to create record', error: err.message });
//   }
// };

// // 🔹 Update a course status (passed or failed)
// export const updateCourseStatus = async (req, res) => {
//   const { studentId, courseCode, passed } = req.body;

//   try {
//     const record = await CourseRecord.findOne({ studentId });
//     if (!record) return res.status(404).json({ message: 'Course record not found' });

//     const course = record.courses.find(c => c.code === courseCode);
//     if (!course) return res.status(404).json({ message: 'Course not found' });

//     course.passed = passed;
//     await record.save();

//     res.status(200).json({ message: 'Course status updated', record });
//   } catch (err) {
//     res.status(500).json({ message: 'Error updating course', error: err.message });
//   }
// };

// // 🔹 Get all courses of a student
// export const getStudentCourses = async (req, res) => {
//   const { studentId } = req.params;

//   try {
//     const record = await CourseRecord.findOne({ studentId }).populate('studentId');
//     if (!record) return res.status(404).json({ message: 'No course records found' });

//     res.status(200).json(record);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch course record', error: err.message });
//   }
// };

// // 🔹 Check if student passed all courses
// export const checkGraduationEligibility = async (req, res) => {
//   const { studentId } = req.params;

//   try {
//     const record = await CourseRecord.findOne({ studentId });
//     if (!record) return res.status(404).json({ message: 'Course record not found' });

//     const failed = record.courses.filter(c => c.passed === false);
//     const eligible = failed.length === 0;

//     res.status(200).json({
//       studentId,
//       eligible,
//       failedCourses: failed.map(c => c.name)
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to check eligibility', error: err.message });
//   }
// };



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
// 🔹 Check if student passed all courses
export const checkGraduationEligibility = async (req, res) => {
  const { studentId } = req.params;

  try {
    const records = await CourseRecord.find({ studentId });

    if (records.length === 0)
      return res.status(404).json({ message: 'No course records found' });

    const failed = records.filter(c => c.passed === false);
    const eligible = failed.length === 0;

    res.status(200).json({
      studentId,
      eligible,
      failedCourses: failed.map(c => c.courseName)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check eligibility', error: err.message });
  }
};
