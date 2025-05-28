import React, { useEffect, useState } from "react";
import axios from "axios";

const allowedGrades = ["B", "C", "D"];

export default function StudentReexamDashboard({ studentId }) {
  const [student, setStudent] = useState({});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/student/${studentId}`);
        setStudent(res.data.student);

        // ✅ Show only failed courses (grade === "F")
        const failedCourses = res.data.courses.filter((c) => c.grade === "F");

        const mapped = failedCourses.map((c) => ({
          ...c,
          newGrade: "",
          passed: false,
        }));

        setCourses(mapped);
      } catch (err) {
        console.error("❌ Failed to load student/courses:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [studentId]);

  const handleGradeChange = (index, grade) => {
    const updated = [...courses];
    updated[index].newGrade = grade;
    updated[index].passed = grade !== "F";
    setCourses(updated);
  };

  const handleSubmitSingle = async (course) => {
    if (!course.newGrade) {
      alert("⚠️ Please select a new grade before submitting.");
      return;
    }

    try {
      await axios.put("http://localhost:5000/api/courses/update", {
        studentId,
        courseCode: course.courseCode,
        grade: course.newGrade,
      });

      alert("✅ Course updated successfully");

      // Refresh
      const res = await axios.get(`http://localhost:5000/api/courses/student/${studentId}`);
      const failedCourses = res.data.courses.filter((c) => c.grade === "F");
      const mapped = failedCourses.map((c) => ({
        ...c,
        newGrade: "",
        passed: false,
      }));
      setCourses(mapped);
    } catch (err) {
      alert("❌ Failed to update course");
    }
  };

  const handleSubmitAll = async () => {
    const updates = courses.map((c) => ({
      courseCode: c.courseCode,
      newGrade: c.newGrade,
    }));

    if (updates.some((u) => !u.newGrade)) {
      alert("⚠️ Please select new grades for all courses.");
      return;
    }

    try {
      await axios.put("http://localhost:5000/api/courses/bulk-update", {
        studentId,
        updates,
      });

      alert("✅ All courses updated successfully");

      // Refresh
      const res = await axios.get(`http://localhost:5000/api/courses/student/${studentId}`);
      const failedCourses = res.data.courses.filter((c) => c.grade === "F");
      const mapped = failedCourses.map((c) => ({
        ...c,
        newGrade: "",
        passed: false,
      }));
      setCourses(mapped);
    } catch (err) {
      alert("❌ Failed to update all courses");
    }
  };

  if (loading) return <p>Loading student and courses...</p>;

  return (
    <div className="p-4 border rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-3">
        {student.fullName} - Re-exam Courses
      </h2>

      {courses.length === 0 ? (
        <p className="text-green-700">✅ This student has no failed courses.</p>
      ) : (
        <>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Course Code</th>
                <th className="border px-2 py-1">Course Name</th>
                <th className="border px-2 py-1">Grade (Before)</th>
                <th className="border px-2 py-1">New Grade</th>
                <th className="border px-2 py-1">Passed?</th>
                <th className="border px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{course.courseCode}</td>
                  <td className="border px-2 py-1">{course.courseName}</td>
                  <td className="border px-2 py-1">{course.grade}</td>
                  <td className="border px-2 py-1">
                    <select
                      className="border px-1 py-0.5"
                      value={course.newGrade}
                      onChange={(e) => handleGradeChange(idx, e.target.value)}
                    >
                      <option value="">Select</option>
                      {allowedGrades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {course.newGrade ? (course.newGrade === "F" ? "❌" : "✅") : ""}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {courses.length === 1 ? (
                      <button
                        className="bg-blue-500 text-white px-2 py-1 text-xs rounded"
                        onClick={() => handleSubmitSingle(course)}
                      >
                        Submit
                      </button>
                    ) : (
                      "Editable"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {courses.length > 1 && (
            <div className="mt-4 text-right">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded shadow"
                onClick={handleSubmitAll}
              >
                Submit All ✅
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
