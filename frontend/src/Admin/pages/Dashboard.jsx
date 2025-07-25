"use client"

import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import "./Dashboard.css"
import { io } from "socket.io-client"
import { ToastContainer, toast } from "react-toastify"
import SkeletonTable from "../../components/loaders/skeletonTable"
import "react-toastify/dist/ReactToastify.css"

// RTK Query imports
import {
  useGetExaminationStatsQuery,
  useGetExaminationPendingQuery,
  useApproveExaminationMutation,
  useRejectExaminationMutation,
} from "../../redux/api/examinationApiSlice"

function Dashboard() {
  // Toolbar State
  const [searchTerm, setSearchTerm] = useState("")
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("All")
  const [visibleColumns, setVisibleColumns] = useState({
    status: true,
    program: true,
    docs: true,
    actions: true,
  })

  // RTK Query hooks
  const {
    data: stats = { pending: 0, nameCorrections: 0, approved: 0 },
    refetch: refetchStats,
    isFetching: statsLoading,
  } = useGetExaminationStatsQuery()

  const {
    data: students = [],
    isLoading: loading,
    isFetching: studentsFetching,
    refetch: refetchStudents,
  } = useGetExaminationPendingQuery({
    search: searchTerm,
    page: currentPage,
    limit: rowsPerPage,
    status: statusFilter,
  })

  const [approveExamination] = useApproveExaminationMutation()
  const [rejectExamination] = useRejectExaminationMutation()

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [socket, setSocket] = useState(null)

  // Socket setup
  useEffect(() => {
    const newSocket = io("http://localhost:5000")
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("✅ Connected to examination socket:", newSocket.id)
    })

    newSocket.on("examination:new-eligible", (data) => {
      console.log("📡 Student became eligible:", data)
      refetchStats()
      refetchStudents()
      toast.success(`🎓 ${data.fullName} is now eligible for graduation!`)
    })

    newSocket.on("nameCorrectionApproved", (data) => {
      toast.success(`✅ Name correction approved for ${data.fullName}`)
      refetchStats()
      refetchStudents()
    })

    newSocket.on("examinationAutoApproved", (data) => {
      toast.success(`🚀 ${data.fullName} auto-approved for examination!`)
      refetchStats()
      refetchStudents()
    })

    return () => {
      newSocket.disconnect()
    }
  }, [refetchStats, refetchStudents])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, rowsPerPage])

  const handleApprove = async (studentId) => {
    const approvedBy = localStorage.getItem("userMongoId")
    if (!approvedBy) {
      toast.error("Approver ID not found in local storage.")
      return
    }

    try {
      await approveExamination({ studentId, approvedBy }).unwrap()
      toast.success("✅ Examination approved successfully!")
    } catch (err) {
      const errorMsg = err?.data?.message || err.message
      toast.error(`❌ Approval failed: ${errorMsg}`)
      console.error("Approval failed:", errorMsg)
    }
  }

  const handleReject = async (studentId) => {
    try {
      await rejectExamination({
        studentId,
        remarks: "Incomplete clearance requirements",
      }).unwrap()
      toast.success("❌ Examination rejected")
    } catch (err) {
      const errorMsg = err?.data?.message || err.message
      toast.error(`❌ Rejection failed: ${errorMsg}`)
      console.error("Rejection failed:", errorMsg)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast.info("🔄 Refreshing table data...")
    try {
      await Promise.all([refetchStats(), refetchStudents()])
      toast.success("✅ Table refreshed successfully!")
    } catch (error) {
      toast.error("❌ Failed to refresh data")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Smart Document Status Logic
  const getDocumentStatus = (student, examRecord) => {
    const { nameCorrectionRequested, nameCorrectionStatus } = student

    if (nameCorrectionRequested === null || nameCorrectionRequested === undefined) {
      return {
        text: "Pending Decision",
        className: "badge-gray",
        icon: "⏳",
      }
    }

    if (nameCorrectionRequested === false || nameCorrectionStatus === "Declined") {
      return {
        text: "Not Required",
        className: "badge-blue",
        icon: "✅",
      }
    }

    if (nameCorrectionRequested === true && nameCorrectionStatus === "Pending") {
      return {
        text: "Incomplete",
        className: "badge-danger",
        icon: "❌",
      }
    }

    if (nameCorrectionStatus === "Document Uploaded") {
      return {
        text: "Waiting Verification",
        className: "badge-warning",
        icon: "⏳",
      }
    }

    if (nameCorrectionStatus === "Approved") {
      return {
        text: "Verified",
        className: "badge-success",
        icon: "✅",
      }
    }

    if (nameCorrectionStatus === "Rejected") {
      return {
        text: "Rejected",
        className: "badge-danger",
        icon: "❌",
      }
    }

    return {
      text: "Unknown",
      className: "badge-gray",
      icon: "❓",
    }
  }

  // Check if any data is loading/fetching
  const isAnyLoading = loading || studentsFetching || statsLoading || isRefreshing

  // Calculate pagination info
  const totalPages = Math.ceil(students.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <h2>Welcome, Examination Officer 👋</h2>

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

        {/* Examination Requests Section */}
        <div className="requests-section">
          <h3>Examination Clearance Requests</h3>

          {/* Toolbar - matching faculty dashboard */}
          <div className="table-toolbar">
            <div className="toolbar-left">
              {/* Show dropdown */}
              <div className="toolbar-item">
                <span>Show:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="show-select"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>

              {/* Auto Refresh button */}
              <button
                onClick={handleRefresh}
                className={`auto-refresh-btn ${isAnyLoading ? "spinning" : ""}`}
                disabled={isAnyLoading}
                title="Auto Refresh"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>

              {/* Status filter */}
              <div className="toolbar-item">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-select"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Search bar - right aligned */}
            <div className="toolbar-right">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder={`Search ${students.length} records...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-toolbar"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>ID</th>
                <th>Student Name</th>
                {visibleColumns.program && <th>Program</th>}
                <th>Passed?</th>
                <th>Can Graduate?</th>
                <th>Name Correction?</th>
                {visibleColumns.docs && <th>Docs</th>}
                {visibleColumns.status && <th>Status</th>}
                {visibleColumns.actions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isAnyLoading ? (
                <tr>
                  <td colSpan="10">
                    <SkeletonTable rows={5} cols={10} />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    {searchTerm || statusFilter !== "All"
                      ? `No students found matching your filters`
                      : "No students found"}
                  </td>
                </tr>
              ) : (
                students.map((item, index) => {
                  const s = item.studentId || {}
                  const docStatus = getDocumentStatus(s, item)
                  const status = item.clearanceStatus

                  return (
                    <tr key={index}>
                      <td>{startIndex + index + 1}</td>
                      <td>{s.studentId}</td>
                      <td>{s.fullName}</td>
                      {visibleColumns.program && <td>{s.program}</td>}
                      <td>{item.hasPassedAllCourses ? "✅" : "❌"}</td>
                      <td>{item.canGraduate ? "✅" : "❌"}</td>
                      <td>
                        {s.nameCorrectionRequested === true ? "Yes" : s.nameCorrectionRequested === false ? "No" : "-"}
                      </td>
                      {visibleColumns.docs && (
                        <td>
                          <span className={`badge ${docStatus.className}`}>
                            {docStatus.icon} {docStatus.text}
                          </span>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td>
                          {!item.hasPassedAllCourses ? (
                            <span className="badge badge-danger">Re-exam Required</span>
                          ) : (
                            <span className={`badge ${status.toLowerCase()}`}>{status}</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.actions && (
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
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages} ({students.length} total)
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default Dashboard
