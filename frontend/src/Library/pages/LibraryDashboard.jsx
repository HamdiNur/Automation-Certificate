"use client"

import React from "react"

import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import LibrarySidebar from "../components/LibrarySidebar"
import SkeletonTable from "../../components/loaders/skeletonTable"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./styles/style.css"

// RTK Query imports
import {
  useGetLibraryStatsQuery,
  useGetLibraryPendingQuery,
  useApproveLibraryMutation,
  useRejectLibraryMutation,
} from "../../redux/api/libraryApiSlice"

function LibraryDashboard() {
  // RTK Query hooks
  const {
    data: stats = { pending: 0, approved: 0, rejected: 0 },
    refetch: refetchStats,
    isFetching: statsLoading,
  } = useGetLibraryStatsQuery()

  const {
    data: recordsData = [],
    isLoading: loading,
    isFetching: recordsFetching,
    refetch: refetchRecords,
  } = useGetLibraryPendingQuery({ search: "", page: 1, limit: 1000 }) // Fetch all records

  const [approveLibrary] = useApproveLibraryMutation()
  const [rejectLibrary] = useRejectLibraryMutation()

  // Toolbar State - same as Faculty Dashboard
  const [searchTerm, setSearchTerm] = useState("")
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("All")

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modal State
  const [expandedRow, setExpandedRow] = useState(null)
  const [loadingApproveId, setLoadingApproveId] = useState(null)
  const [socket, setSocket] = useState(null)

  // Transform records data - handle both array and object responses
  const records = Array.isArray(recordsData) ? recordsData : recordsData.pending || []

  // Socket setup
  useEffect(() => {
    const newSocket = io("http://localhost:5000")
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("✅ Library Socket connected:", newSocket.id)
    })

    newSocket.on("library:new-pending", (data) => {
      console.log("📡 New library request received:", data)
      refetchRecords()
      refetchStats()
      toast.info("📢 New library clearance request received!")
    })

    return () => {
      newSocket.disconnect()
    }
  }, [refetchRecords, refetchStats])

  // Filter and pagination logic - exactly like Faculty Dashboard
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      `${rec.groupId?.groupNumber || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${rec.groupId?.projectTitle || ""}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "All" || rec.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + rowsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, rowsPerPage])

  const handleApprove = async (groupId) => {
    try {
      setLoadingApproveId(groupId)
      const staffId = localStorage.getItem("userId")

      await approveLibrary({
        groupId,
        libraryStaffId: staffId,
      }).unwrap()

      setExpandedRow(null)
      toast.success("✅ Group approved successfully.")
    } catch (err) {
      console.error("❌ Approval failed:", err)
      toast.error(err?.data?.message || "Error during approval.")
    } finally {
      setLoadingApproveId(null)
    }
  }

  const handleReject = async (groupId) => {
    const remarks = prompt("Enter reason for rejection:")
    if (!remarks) return

    try {
      const staffId = localStorage.getItem("userId")

      await rejectLibrary({
        groupId,
        remarks,
        libraryStaffId: staffId,
      }).unwrap()

      setExpandedRow(null)
      toast.error("❌ Group rejected.")
    } catch (err) {
      console.error("❌ Rejection failed:", err)
      toast.error("Error during rejection.")
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast.info("🔄 Refreshing table data...")

    try {
      await Promise.all([refetchRecords(), refetchStats()])
      toast.success("✅ Table refreshed successfully!")
    } catch (error) {
      toast.error("❌ Failed to refresh data")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Check if any data is loading/fetching
  const isAnyLoading = loading || recordsFetching || statsLoading || isRefreshing

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>📚 Library Dashboard 👋</h2>

        {/* Dashboard Stats Widgets */}
        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>Pending Requests</h3>
            <p>{stats.pending}</p>
          </div>
          <div className="widget-card">
            <h3>Approved</h3>
            <p>{stats.approved}</p>
          </div>
          <div className="widget-card">
            <h3>Rejected</h3>
            <p>{stats.rejected}</p>
          </div>
        </div>

        {/* Library Clearance Requests Section */}
        <div className="requests-section">
          <h3>📝 Library Clearance Requests</h3>

          {/* Toolbar - matching Faculty Dashboard layout */}
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

              {/* Auto Refresh button with unified spinner */}
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
                  placeholder={`Search ${filteredRecords.length} records...`}
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
                <th>Group</th>
                <th>Project Title</th>
                <th>Faculty Cleared</th>
                <th>Thesis Received</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isAnyLoading ? (
                <tr>
                  <td colSpan="7">
                    <SkeletonTable rows={5} cols={7} />
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    {searchTerm || statusFilter !== "All"
                      ? `No records found matching your filters`
                      : "🎉 No pending records found"}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, index) => (
                  <React.Fragment key={rec._id}>
                    <tr>
                      <td>{startIndex + index + 1}</td>
                      <td>{rec.groupId?.groupNumber ? `Group ${rec.groupId.groupNumber}` : "-"}</td>
                      <td>{rec.groupId?.projectTitle || "—"}</td>
                      <td>
                        <span className={`badge ${rec.facultyCleared ? "approved" : "pending"}`}>
                          {rec.facultyCleared ? "Cleared" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${rec.thesisBookReveiced ? "approved" : "rejected"}`}>
                          {rec.thesisBookReveiced ? "Received" : "Missing"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${rec.status.toLowerCase()}`}>{rec.status}</span>
                      </td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => setExpandedRow(expandedRow === rec._id ? null : rec._id)}
                        >
                          👁 View
                        </button>
                      </td>
                    </tr>
                    {expandedRow === rec._id && (
                      <tr>
                        <td colSpan="7">
                          <div style={{ backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
                            <p>
                              <strong>📘 Members:</strong>
                            </p>
                            <ul>
                              {rec.members?.map((m) => (
                                <li key={m._id}>
                                  {m.fullName} ({m.studentId})
                                </li>
                              ))}
                            </ul>
                            <div style={{ marginTop: "10px" }}>
                              <button
                                className="btn-approve"
                                onClick={() => handleApprove(rec.groupId._id)}
                                disabled={loadingApproveId === rec.groupId._id}
                              >
                                {loadingApproveId === rec.groupId._id ? "Approving..." : "✅ Approve"}
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => handleReject(rec.groupId._id)}
                                style={{ marginLeft: "10px" }}
                              >
                                ❌ Reject
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
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
                Page {currentPage} of {totalPages} ({filteredRecords.length} total)
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

export default LibraryDashboard

