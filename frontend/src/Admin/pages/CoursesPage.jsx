"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./CoursePage.css"

const CoursesPage = () => {
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourses(page)
  }, [page])

  useEffect(() => {
    fetchCourses(1, search) // Reset to page 1 when user types in search
  }, [search])

  const fetchCourses = async (currentPage = 1, keyword = search) => {
    try {
      setLoading(true)
      const res = await axios.get(
        `http://localhost:5000/api/courses/all?page=${currentPage}&limit=10&search=${keyword}`,
      )
      const flattened = res.data.data.flatMap((item) =>
        item.courses.map((course) => ({
          ...course,
          student: item.student,
        })),
      )
      setCourses(flattened)
      setPage(res.data.page)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      console.error("Error fetching course records", err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePass = async (studentId, courseCode, currentPassed) => {
    try {
      await axios.put("http://localhost:5000/api/courses/update", {
        studentId,
        courseCode,
        passed: !currentPassed,
      })
      fetchCourses(page)
    } catch (err) {
      alert("Update failed.")
    }
  }

  const handleReexamNavigate = (studentId) => {
    navigate(`/re-exam/${studentId}`)
  }

  const filtered = courses.filter(
    (c) =>
      c.student.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      c.student.fullName?.toLowerCase().includes(search.toLowerCase()),
  )

  // Calculate stats for the header cards
  const stats = {
    total: filtered.length,
    passed: filtered.filter((c) => c.passed).length,
    failed: filtered.filter((c) => !c.passed).length,
  }

  return (
    <div className="page-container">
      {/* Enhanced Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">📘</div>
            <div>
              <h1>Course Records</h1>
              <p>Manage and monitor student course performance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
        <div className="stat-card passed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.passed}</div>
            <div className="stat-label">Passed</div>
          </div>
        </div>
        <div className="stat-card failed">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{stats.failed}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>
      </div>

      {/* Enhanced Search Section */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by name, student ID, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="export-btn">
            <span className="btn-icon">📊</span>
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="loader"></div>
          <p>Loading course records...</p>
        </div>
      ) : (
        <div className="content-section">
          {/* Modern Table */}
          <div className="table-container">
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Program</th>
                    <th>Course</th>
                    <th>Semester</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <tr key={idx} className="table-row">
                      <td className="student-cell">
                        <div className="student-info">
                          <div className="student-avatar">{c.student.fullName?.charAt(0) || "S"}</div>
                          <div className="student-details">
                            <div className="student-name">{c.student.fullName}</div>
                            <div className="student-id">{c.student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="program-badge">{c.student.program}</span>
                      </td>
                      <td className="course-cell">
                        <div className="course-name">{c.courseName}</div>
                        <div className="course-code">{c.courseCode}</div>
                      </td>
                      <td>
                        <span className="semester-badge">Semester {c.semester}</span>
                      </td>
                      <td>
                        <span className={`grade-badge grade-${c.grade.toLowerCase()}`}>{c.grade}</span>
                      </td>
                      <td>
                        {c.passed ? (
                          <span className="status-badge status-passed">✅ Passed</span>
                        ) : (
                          <span className="status-badge status-failed">❌ Failed</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        {c.passed ? (
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleTogglePass(c.student._id, c.courseCode, c.passed)}
                          >
                            <span className="btn-icon">✏️</span>
                            Edit
                          </button>
                        ) : (
                          <button className="action-btn reexam-btn" onClick={() => handleReexamNavigate(c.student._id)}>
                            <span className="btn-icon">🔄</span>
                            Re-exam
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No records found</h3>
                <p>{search ? "Try adjusting your search terms" : "No course records available"}</p>
              </div>
            )}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="pagination-section">
              <div className="pagination-info">
                <span>
                  Showing page {page} of {totalPages}
                </span>
              </div>
              <div className="pagination-controls">
                <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  ⬅ Previous
                </button>
                <div className="page-numbers">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i))
                    return (
                      <button
                        key={pageNum}
                        className={`page-number ${page === pageNum ? "active" : ""}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Next ➡
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CoursesPage
