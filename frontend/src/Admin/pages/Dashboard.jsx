"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import "./Dashboard.css"
import { io } from "socket.io-client"
import { ToastContainer, toast } from "react-toastify"
import SkeletonTable from "../../components/loaders/skeletonTable"
import "react-toastify/dist/ReactToastify.css"

function Dashboard() {
  const [stats, setStats] = useState({
    pending: 0,
    nameCorrections: 0,
    approved: 0,
  })
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchStats()
    fetchPending()

    const socket = io("http://localhost:5000")

    socket.on("connect", () => {
      console.log("✅ Connected to examination socket:", socket.id)
    })

    socket.on("examination:new-eligible", (data) => {
      console.log("📡 Student became eligible:", data)
      fetchStats()
      fetchPending()
      toast.success(`🎓 ${data.fullName} is now eligible for graduation!`)
    })

    // ✅ NEW: Listen for name correction events
    socket.on("nameCorrectionApproved", (data) => {
      toast.success(`✅ Name correction approved for ${data.fullName}`)
      fetchStats()
      fetchPending()
    })

    socket.on("examinationAutoApproved", (data) => {
      toast.success(`🚀 ${data.fullName} auto-approved for examination!`)
      fetchStats()
      fetchPending()
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/examination/stats")
      setStats(res.data)
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  const fetchPending = async () => {
    try {
      setLoading(true)
      const res = await axios.get("http://localhost:5000/api/examination/pending")
      setStudents(res.data)
    } catch (err) {
      console.error("Error fetching examination records", err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIXED: Use correct API endpoint
  const handleApprove = async (studentId) => {
    const approvedBy = localStorage.getItem("userMongoId")

    if (!approvedBy) {
      alert("Approver ID not found in local storage.")
      return
    }

    try {
      // ✅ FIXED: Use correct endpoint
      await axios.post("http://localhost:5000/api/examination/approve", {
        studentId,
        approvedBy,
      })

      toast.success("✅ Examination approved successfully!")
      fetchStats()
      fetchPending()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message
      toast.error(`❌ Approval failed: ${errorMsg}`)
      console.error("Approval failed:", errorMsg)
    }
  }

  const handleReject = async (studentId) => {
    try {
      await axios.post("http://localhost:5000/api/examination/reject", {
        studentId,
        remarks: "Incomplete clearance requirements",
      })

      toast.success("❌ Examination rejected")
      fetchStats()
      fetchPending()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message
      toast.error(`❌ Rejection failed: ${errorMsg}`)
      console.error("Rejection failed:", errorMsg)
    }
  }

  // ✅ NEW: Smart Document Status Logic
  const getDocumentStatus = (student, examRecord) => {
    const { nameCorrectionRequested, nameCorrectionStatus } = student

    // 1. Before student chooses
    if (nameCorrectionRequested === null || nameCorrectionRequested === undefined) {
      return {
        text: "Pending Decision",
        className: "badge-gray",
        icon: "⏳",
      }
    }

    // 2. Student chose "NO" - No name correction needed
    if (nameCorrectionRequested === false || nameCorrectionStatus === "Declined") {
      return {
        text: "Not Required",
        className: "badge-blue",
        icon: "✅",
      }
    }

    // 3. Student chose "YES" but hasn't uploaded document
    if (nameCorrectionRequested === true && nameCorrectionStatus === "Pending") {
      return {
        text: "Incomplete",
        className: "badge-danger",
        icon: "❌",
      }
    }

    // 4. Student uploaded document, waiting for verification
    if (nameCorrectionStatus === "Document Uploaded") {
      return {
        text: "Waiting Verification",
        className: "badge-warning",
        icon: "⏳",
      }
    }

    // 5. Officer approved the document
    if (nameCorrectionStatus === "Approved") {
      return {
        text: "Verified",
        className: "badge-success",
        icon: "✅",
      }
    }

    // 6. Officer rejected the document
    if (nameCorrectionStatus === "Rejected") {
      return {
        text: "Rejected",
        className: "badge-danger",
        icon: "❌",
      }
    }

    // Default fallback
    return {
      text: "Unknown",
      className: "badge-gray",
      icon: "❓",
    }
  }

  // ✅ Filter students based on search term
  const filteredStudents = students.filter((item) => {
    const student = item.studentId || {}
    const searchLower = searchTerm.toLowerCase()

    return (
      student.fullName?.toLowerCase().includes(searchLower) || student.studentId?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <div className="dashboard-main">
        {/* Stat Cards */}
        <div className="cards">
          <div className="card blue">
            <div>
              <div>{stats.pending}</div>
              <span>Pending Requests</span>
            </div>
          </div>

          <div className="card yellow">
            <div>
              <div>{stats.nameCorrections}</div>
              <span>Name Correction Requests</span>
            </div>
          </div>

          <div className="card green">
            <div>
              <div>{stats.approved}</div>
              <span>Approved Clearances</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="🔍 Search by Student Name or Student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Pending Table */}
        {loading ? (
          <SkeletonTable rows={6} cols={10} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>ID</th>
                <th>Student Name</th>
                <th>Program</th>
                <th>Passed?</th>
                <th>Can Graduate?</th>
                <th>Name Correction?</th>
                <th>Docs</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((item, index) => {
                  const s = item.studentId || {}
                  const docStatus = getDocumentStatus(s, item) // ✅ NEW: Smart status
                  const status = item.clearanceStatus

                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{s.studentId}</td>
                      <td>{s.fullName}</td>
                      <td>{s.program}</td>
                      <td>{item.hasPassedAllCourses ? "✅" : "❌"}</td>
                      <td>{item.canGraduate ? "✅" : "❌"}</td>
                      <td>
                        {s.nameCorrectionRequested === true ? "Yes" : s.nameCorrectionRequested === false ? "No" : "-"}
                      </td>
                      <td>
                        {/* ✅ NEW: Smart document status */}
                        <span className={`badge ${docStatus.className}`}>
                          {docStatus.icon} {docStatus.text}
                        </span>
                      </td>
                      <td>
                        {!item.hasPassedAllCourses ? (
                          <span className="badge badge-danger">Re-exam Required</span>
                        ) : (
                          <span className={`badge ${status.toLowerCase()}`}>{status}</span>
                        )}
                      </td>
                      <td>
                        {status === "Pending" ? (
                          <>
                            <button
                              className="btn-approve"
                              onClick={() => handleApprove(s._id)}
                              disabled={!item.canGraduate}
                            >
                              Approve
                            </button>
                            <button className="btn-reject" onClick={() => handleReject(s._id)}>
                              Reject
                            </button>
                          </>
                        ) : (
                          <button className="btn-view">View Certificate</button>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    {searchTerm ? `No students found matching "${searchTerm}"` : "No students found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default Dashboard
