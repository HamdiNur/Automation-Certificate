import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CoursePage.css";

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses(page);
  }, [page]);

  useEffect(() => {
  fetchCourses(1, search); // Reset to page 1 when user types in search
}, [search]);

const fetchCourses = async (currentPage = 1, keyword = search) => {
  try {
    setLoading(true);
    const res = await axios.get(
      `http://localhost:5000/api/courses/all?page=${currentPage}&limit=10&search=${keyword}`
    );
    const flattened = res.data.data.flatMap((item) =>
      item.courses.map((course) => ({
        ...course,
        student: item.student,
      }))
    );
    setCourses(flattened);
    setPage(res.data.page);
    setTotalPages(res.data.totalPages);
  } catch (err) {
    console.error("Error fetching course records", err);
  } finally {
    setLoading(false);
  }
};


  const handleTogglePass = async (studentId, courseCode, currentPassed) => {
    try {
      await axios.put("http://localhost:5000/api/courses/update", {
        studentId,
        courseCode,
        passed: !currentPassed,
      });
      fetchCourses(page);
    } catch (err) {
      alert("Update failed.");
    }
  };

  const handleReexamNavigate = (studentId) => {
    navigate(`/re-exam/${studentId}`);
  };

  const filtered = courses.filter((c) =>
    c.student.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    c.student.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <h2>📘 Course Records</h2>
      <input
        className="search-box"
        placeholder="Search by name or student ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="spinner-container">
          <div className="loader"></div>
          <p>Loading courses...</p>
        </div>
      ) : (
        <>
          <div className="scroll-wrapper">
            <table className="course-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Program</th>
                  <th>Semester</th>
                  <th>Course</th>
                  <th>Grade</th>
                  <th>Passed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr key={idx}>
                    <td>{c.student.studentId}</td>
                    <td>{c.student.fullName}</td>
                    <td>{c.student.program}</td>
                    <td>{c.semester}</td>
                    <td>{c.courseName}</td>
                    <td>{c.grade}</td>
                    <td>{c.passed ? "✅" : "❌"}</td>
                    <td>
  {c.passed ? (
    <button
      className="edit-btn"
      onClick={() =>
        handleTogglePass(c.student._id, c.courseCode, c.passed)
      }
    >
      ✏️ Edit
    </button>
  ) : (
    <button
      style={{
        backgroundColor: "#4CAF50",
        color: "white",
        padding: "3px 6px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
      }}
      onClick={() => handleReexamNavigate(c.student._id)}
    >
      Re-exam
    </button>
  )}
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="pagination-controls" style={{ marginTop: "20px", textAlign: "center" }}>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              ⬅ Prev
            </button>
            <span style={{ margin: "0 12px" }}>
              Page {page} of {totalPages}
            </span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next ➡
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CoursesPage;
