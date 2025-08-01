"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import "./Dashboard.css"
import { toast, ToastContainer } from "react-toastify"

function ClearedStudents() {
  const navigate = useNavigate()
  const [clearedStudents, setClearedStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // 🔍 Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [nameCorrectionFilter, setNameCorrectionFilter] = useState("")

  useEffect(() => {
    fetchClearedStudents()
  }, [])

  const fetchClearedStudents = async () => {
    try {
      setLoading(true)
      // ✅ Fetch students with approved examination status
      const response = await fetch("http://localhost:5000/api/examination/cleared-students")
      const data = await response.json()

      if (response.ok) {
        setClearedStudents(data)
      } else {
        console.error("Failed to fetch cleared students:", data.message)
        toast.error("Failed to fetch cleared students")
      }
    } catch (err) {
      console.error("Error fetching cleared students:", err)
      toast.error("Error fetching cleared students")
    } finally {
      setLoading(false)
    }
  }

  // ✅ Smart Document Status Logic (same as Dashboard)
  const getDocumentStatus = (student) => {
    const { nameCorrectionRequested, nameCorrectionStatus } = student

    if (nameCorrectionRequested === null || nameCorrectionRequested === undefined) {
      return { text: "Pending Decision", className: "badge-gray", icon: "⏳" }
    }

    if (nameCorrectionRequested === false || nameCorrectionStatus === "Declined") {
      return { text: "Not Required", className: "badge-blue", icon: "✅" }
    }

    if (nameCorrectionRequested === true && nameCorrectionStatus === "Pending") {
      return { text: "Incomplete", className: "badge-danger", icon: "❌" }
    }

    if (nameCorrectionStatus === "Document Uploaded") {
      return { text: "Waiting Verification", className: "badge-warning", icon: "⏳" }
    }

    if (nameCorrectionStatus === "Approved") {
      return { text: "Verified", className: "badge-success", icon: "✅" }
    }

    if (nameCorrectionStatus === "Rejected") {
      return { text: "Rejected", className: "badge-danger", icon: "❌" }
    }

    return { text: "Unknown", className: "badge-gray", icon: "❓" }
  }

  // ✅ Get unique programs and years for filters
  const uniquePrograms = [...new Set(clearedStudents.map((s) => s.studentId?.program).filter(Boolean))]
  const uniqueYears = [...new Set(clearedStudents.map((s) => s.studentId?.yearOfGraduation).filter(Boolean))].sort()

  // ✅ Filter students based on all criteria
  const filteredStudents = clearedStudents.filter((item) => {
    const student = item.studentId || {}
    const searchLower = searchTerm.toLowerCase()

    // Search filter
    const matchesSearch =
      student.fullName?.toLowerCase().includes(searchLower) || student.studentId?.toLowerCase().includes(searchLower)

    // Program filter
    const matchesProgram = !programFilter || student.program === programFilter

    // Year filter
    const matchesYear = !yearFilter || student.yearOfGraduation?.toString() === yearFilter

    // Name correction filter
    const matchesNameCorrection =
      !nameCorrectionFilter ||
      (nameCorrectionFilter === "yes" && student.nameCorrectionRequested === true) ||
      (nameCorrectionFilter === "no" && student.nameCorrectionRequested === false) ||
      (nameCorrectionFilter === "pending" &&
        (student.nameCorrectionRequested === null || student.nameCorrectionRequested === undefined))

    return matchesSearch && matchesProgram && matchesYear && matchesNameCorrection
  })

  // ✅ View student details in modal
  const handleViewDetails = (student) => {
    setSelectedStudent(student)
    setShowModal(true)
  }

  // ✅ Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setProgramFilter("")
    setYearFilter("")
    setNameCorrectionFilter("")
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <div className="dashboard-main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>✅ Cleared Students</h2>
          <div style={{ color: "#666", fontSize: "14px" }}>
            {filteredStudents.length} of {clearedStudents.length} students
          </div>
        </div>

        {/* 🔍 Filters Section */}
        <div className="filter-bar" style={{ flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search by Name or Student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: "250px" }}
          />

          {/* Program Filter */}
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            style={{ minWidth: "150px" }}
          >
            <option value="">All Programs</option>
            {uniquePrograms.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ minWidth: "120px" }}>
            <option value="">All Years</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Name Correction Filter */}
          <select
            value={nameCorrectionFilter}
            onChange={(e) => setNameCorrectionFilter(e.target.value)}
            style={{ minWidth: "150px" }}
          >
            <option value="">All Name Corrections</option>
            <option value="yes">Requested</option>
            <option value="no">Not Requested</option>
            <option value="pending">Pending Decision</option>
          </select>

          {/* Clear Filters */}
          <button className="btn-cancel" onClick={clearFilters} style={{ padding: "8px 12px" }}>
            Clear Filters
          </button>
        </div>

        {/* 📊 Students Table */}
        {loading ? (
          <div className="loading-text">Loading cleared students...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Grad Year</th>
                <th>Passed?</th>
                <th>Can Graduate?</th>
                <th>Name Correction?</th>
                <th>Docs Status</th>
                <th>Cleared Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((item, index) => {
                  const s = item.studentId || {}
                  const docStatus = getDocumentStatus(s)

                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{s.studentId}</td>
                      <td>{s.fullName}</td>
                      <td>{s.program}</td>
                      <td>{s.yearOfGraduation}</td>
                      <td>{item.hasPassedAllCourses ? "✅" : "❌"}</td>
                      <td>{item.canGraduate ? "✅" : "❌"}</td>
                      <td>
                        {s.nameCorrectionRequested === true ? "Yes" : s.nameCorrectionRequested === false ? "No" : "-"}
                      </td>
                      <td>
                        <span className={`badge ${docStatus.className}`}>
                          {docStatus.icon} {docStatus.text}
                        </span>
                      </td>
                      <td>{item.clearedAt ? new Date(item.clearedAt).toLocaleDateString() : "-"}</td>
                      <td>
                        <button className="btn-view" onClick={() => handleViewDetails(item)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    {searchTerm || programFilter || yearFilter || nameCorrectionFilter
                      ? "No students found matching the current filters"
                      : "No cleared students found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* 📋 Student Details Modal */}
        {showModal && selectedStudent && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: "600px", textAlign: "left" }}>
              <h3 style={{ textAlign: "center", marginBottom: "20px" }}>📋 Student Details</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p>
                    <strong>Student ID:</strong> {selectedStudent.studentId?.studentId}
                  </p>
                  <p>
                    <strong>Full Name:</strong> {selectedStudent.studentId?.fullName}
                  </p>
                  <p>
                    <strong>Mother's Name:</strong> {selectedStudent.studentId?.motherName}
                  </p>
                  <p>
                    <strong>Gender:</strong> {selectedStudent.studentId?.gender}
                  </p>
                  <p>
                    <strong>Program:</strong> {selectedStudent.studentId?.program}
                  </p>
                  <p>
                    <strong>Faculty:</strong> {selectedStudent.studentId?.faculty}
                  </p>
                </div>

                <div>
                  <p>
                    <strong>Admission Year:</strong> {selectedStudent.studentId?.yearOfAdmission}
                  </p>
                  <p>
                    <strong>Graduation Year:</strong> {selectedStudent.studentId?.yearOfGraduation}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedStudent.studentId?.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedStudent.studentId?.phone}
                  </p>
                  <p>
                    <strong>Student Class:</strong> {selectedStudent.studentId?.studentClass}
                  </p>
                  <p>
                    <strong>Mode:</strong> {selectedStudent.studentId?.mode}
                  </p>
                </div>
              </div>

              <hr style={{ margin: "20px 0" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <h4>📚 Academic Status</h4>
                  <p>
                    <strong>Passed All Courses:</strong> {selectedStudent.hasPassedAllCourses ? "✅ Yes" : "❌ No"}
                  </p>
                  <p>
                    <strong>Can Graduate:</strong> {selectedStudent.canGraduate ? "✅ Yes" : "❌ No"}
                  </p>
                  <p>
                    <strong>Clearance Status:</strong>
                    <span className={`badge ${selectedStudent.clearanceStatus?.toLowerCase()}`}>
                      {selectedStudent.clearanceStatus}
                    </span>
                  </p>
                  <p>
                    <strong>Cleared Date:</strong>{" "}
                    {selectedStudent.clearedAt ? new Date(selectedStudent.clearedAt).toLocaleDateString() : "-"}
                  </p>
                </div>

                <div>
                  <h4>📝 Name Correction</h4>
                  <p>
                    <strong>Requested:</strong>
                    {selectedStudent.studentId?.nameCorrectionRequested === true
                      ? "Yes"
                      : selectedStudent.studentId?.nameCorrectionRequested === false
                        ? "No"
                        : "Not Decided"}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedStudent.studentId?.nameCorrectionStatus || "N/A"}
                  </p>
                  {selectedStudent.studentId?.requestedName && (
                    <p>
                      <strong>Requested Name:</strong> {selectedStudent.studentId.requestedName}
                    </p>
                  )}
                  {selectedStudent.studentId?.rejectionReason && (
                    <p>
                      <strong>Rejection Reason:</strong> {selectedStudent.studentId.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="modal-buttons" style={{ marginTop: "24px" }}>
                <button className="btn-cancel" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default ClearedStudents
