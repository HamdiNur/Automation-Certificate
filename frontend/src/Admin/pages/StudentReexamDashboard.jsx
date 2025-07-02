"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Sidebar from "../components/Sidebar"

import "../pages/styling/style.css"

const allowedGrades = ["C", "D"] // ✅ Re-exam students can only get C or D

export default function StudentReexamDashboard({ studentId }) {
  const [student, setStudent] = useState({})
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [actionType, setActionType] = useState("") // 'single' or 'all'
  const [stats, setStats] = useState({ total: 0, failed: 0, completed: 0 })

  useEffect(() => {
    fetchData()
  }, [studentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`http://localhost:5000/api/courses/student/${studentId}`)
      setStudent(res.data.student)

      // ✅ Show only failed courses (grade === "F")
      const failedCourses = res.data.courses.filter((c) => c.grade === "F")
      const mapped = failedCourses.map((c) => ({
        ...c,
        newGrade: "",
        passed: false,
        isModified: false,
      }))

      setCourses(mapped)

      // ✅ Calculate stats
      const totalCourses = res.data.courses.length
      const failedCount = failedCourses.length
      const completedCount = totalCourses - failedCount

      setStats({
        total: totalCourses,
        failed: failedCount,
        completed: completedCount,
      })
    } catch (err) {
      console.error("❌ Failed to load student/courses:", err.message)
      toast.error("Failed to load student data")
    } finally {
      setLoading(false)
    }
  }

  const handleGradeChange = (index, grade) => {
    const updated = [...courses]
    updated[index].newGrade = grade
    updated[index].passed = grade === "C" || grade === "D" // ✅ Only C and D are passing for re-exams
    updated[index].isModified = true
    setCourses(updated)
  }

  const getGradeInfo = (grade) => {
    const gradeMap = {
      A: { label: "Excellent", color: "#10b981", points: "4.0" },
      B: { label: "Good", color: "#3b82f6", points: "3.0" },
      C: { label: "Satisfactory", color: "#10b981", points: "2.0" }, // ✅ Green for passing
      D: { label: "Pass", color: "#3b82f6", points: "1.0" }, // ✅ Blue for passing
      F: { label: "Fail", color: "#ef4444", points: "0.0" },
    }
    return gradeMap[grade] || { label: "Unknown", color: "#6b7280", points: "0.0" }
  }

  const handleSubmitSingle = (course) => {
    if (!course.newGrade) {
      toast.warning("⚠️ Please select a new grade before submitting.")
      return
    }
    setSelectedCourse(course)
    setActionType("single")
    setShowConfirmModal(true)
  }

  const handleSubmitAll = () => {
    const updates = courses.filter((c) => c.isModified)
    if (updates.length === 0) {
      toast.warning("⚠️ No changes to submit.")
      return
    }
    if (updates.some((u) => !u.newGrade)) {
      toast.warning("⚠️ Please select new grades for all modified courses.")
      return
    }
    setActionType("all")
    setShowConfirmModal(true)
  }

  const confirmSubmit = async () => {
    try {
      setSubmitting(true)
      setShowConfirmModal(false)

      if (actionType === "single") {
        await axios.put("http://localhost:5000/api/courses/update", {
          studentId,
          courseCode: selectedCourse.courseCode,
          grade: selectedCourse.newGrade,
        })
        toast.success(`✅ ${selectedCourse.courseName} updated successfully!`)
      } else {
        const updates = courses
          .filter((c) => c.isModified)
          .map((c) => ({
            courseCode: c.courseCode,
            newGrade: c.newGrade,
          }))

        await axios.put("http://localhost:5000/api/courses/bulk-update", {
          studentId,
          updates,
        })
        toast.success(`✅ ${updates.length} courses updated successfully!`)
      }

      // ✅ Refresh data after any update
      await fetchData()
    } catch (err) {
      toast.error("❌ Failed to update courses")
      console.error(err)
    } finally {
      setSubmitting(false)
      setSelectedCourse(null)
    }
  }

  const resetChanges = () => {
    const reset = courses.map((c) => ({
      ...c,
      newGrade: "",
      passed: false,
      isModified: false,
    }))
    setCourses(reset)
    toast.info("🔄 Changes reset")
  }

  const modifiedCount = courses.filter((c) => c.isModified).length

  if (loading) {
    return (
      <div className="reexam-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading student and courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reexam-container">
      {/* ✅ Header Section */}
      <div className="reexam-header">
        <div className="student-info">
          <div className="student-avatar">
            <span>{student.fullName?.charAt(0) || "S"}</span>
          </div>
          <div className="student-details">
            <h1>{student.fullName}</h1>
            <div className="student-meta">
              <span className="student-id">ID: {student.studentId}</span>
              <span className="student-program">{student.program}</span>
              <span className="student-year">Year {student.yearOfAdmission}</span>
            </div>
          </div>
        </div>

        {/* ✅ Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Courses</div>
          </div>
          <div className="stat-card failed">
            <div className="stat-number">{stats.failed}</div>
            <div className="stat-label">Failed Courses</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Passed Courses</div>
          </div>
          <div className="stat-card progress">
            <div className="stat-number">{Math.round((stats.completed / stats.total) * 100)}%</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </div>

      {/* ✅ Main Content */}
      <div className="reexam-content">
        {courses.length === 0 ? (
          <div className="success-state">
            <div className="success-icon">🎉</div>
            <h2>Congratulations!</h2>
            <p>This student has no failed courses. All courses have been passed successfully.</p>
          </div>
        ) : (
          <>
            {/* ✅ Action Bar */}
            <div className="action-bar">
              <div className="action-info">
                <h2>📚 Re-exam Courses ({courses.length})</h2>
                <p>Update grades for failed courses below</p>
                {modifiedCount > 0 && <span className="modified-indicator">{modifiedCount} course(s) modified</span>}
              </div>
              <div className="action-buttons">
                {modifiedCount > 0 && (
                  <>
                    <button className="btn btn-secondary" onClick={resetChanges}>
                      🔄 Reset Changes
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmitAll} disabled={submitting}>
                      {submitting ? "Submitting..." : `✅ Submit All (${modifiedCount})`}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ✅ Grade Reference */}
            <div className="grade-reference">
              <h3>📊 Re-exam Grade Reference</h3>
              <div className="reexam-notice">
                <span>ℹ️</span>
                <span>Re-exam students can only achieve grades C or D. Maximum grade for re-exams is C.</span>
              </div>
              <div className="grade-scale">
                {["C", "D", "F"].map((grade) => {
                  const info = getGradeInfo(grade)
                  return (
                    <div key={grade} className="grade-item">
                      <span className="grade-letter" style={{ backgroundColor: info.color }}>
                        {grade}
                      </span>
                      <span className="grade-label">{info.label}</span>
                      <span className="grade-points">{info.points} pts</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ✅ Courses Grid */}
            <div className="courses-grid">
              {courses.map((course, idx) => {
                const oldGradeInfo = getGradeInfo(course.grade)
                const newGradeInfo = course.newGrade ? getGradeInfo(course.newGrade) : null

                return (
                  <div key={idx} className={`course-card ${course.isModified ? "modified" : ""}`}>
                    <div className="course-header">
                      <div className="course-title">
                        <h3>{course.courseName}</h3>
                        <span className="course-code">{course.courseCode}</span>
                      </div>
                      <div className="course-credits">
                        <span>{course.credits || 3} Credits</span>
                      </div>
                    </div>

                    <div className="course-body">
                      <div className="grade-section">
                        <div className="current-grade">
                          <label>Current Grade</label>
                          <div className="grade-display">
                            <span className="grade-badge fail" style={{ backgroundColor: oldGradeInfo.color }}>
                              {course.grade}
                            </span>
                            <span className="grade-info">{oldGradeInfo.label}</span>
                          </div>
                        </div>

                        <div className="arrow">→</div>

                        <div className="new-grade">
                          <label>New Grade</label>
                          <select
                            className="grade-select"
                            value={course.newGrade}
                            onChange={(e) => handleGradeChange(idx, e.target.value)}
                          >
                            <option value="">Select Grade</option>
                            {allowedGrades.map((g) => (
                              <option key={g} value={g}>
                                {g} - {getGradeInfo(g).label}
                              </option>
                            ))}
                          </select>
                          {newGradeInfo && (
                            <div className="grade-preview">
                              <span className="grade-badge" style={{ backgroundColor: newGradeInfo.color }}>
                                {course.newGrade}
                              </span>
                              <span className="grade-info">{newGradeInfo.label}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="course-status">
                        <div className="status-indicator">
                          {course.newGrade ? (
                            course.passed ? (
                              <span className="status-badge success">✅ Will Pass</span>
                            ) : (
                              <span className="status-badge fail">❌ Still Failed</span>
                            )
                          ) : (
                            <span className="status-badge pending">⏳ Select Grade</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="course-footer">
                      <div className="course-meta">
                        <span>Semester {course.semester}</span>
                        <span>Re-exam Available</span>
                      </div>
                      {/* {course.isModified && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSubmitSingle(course)}
                          disabled={!course.newGrade || submitting}
                        >
                      {submitting ? "Submitting..." : `✅ Submit  (${modifiedCount})`}
                        </button>
                      )} */}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ✅ Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Grade Update</h3>
            </div>
            <div className="modal-body">
              {actionType === "single" ? (
                <p>
                  Are you sure you want to update <strong>{selectedCourse?.courseName}</strong> from grade{" "}
                  <strong>{selectedCourse?.grade}</strong> to <strong>{selectedCourse?.newGrade}</strong>?
                </p>
              ) : (
                <p>
                  Are you sure you want to update <strong>{modifiedCount} courses</strong> with the new grades?
                </p>
              )}
              <div className="warning-note">
                <span>⚠️</span>
                <span>This action cannot be undone. The student's academic record will be permanently updated.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmSubmit} disabled={submitting}>
                {submitting ? "Updating..." : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}
