"use client"

import React, { useState, useEffect } from "react"
import { io } from "socket.io-client"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import SkeletonTable from "../../components/loaders/skeletonTable"
import LabSidebar from "../components/LabSidebar"
import "./style/style.css"

// RTK Query imports
import {
  useGetLabStatsQuery,
  useGetPendingLabQuery,
  useApproveLabMutation,
  useRejectLabMutation,
} from "../../redux/api/labApiSlice"

function LabDashboard() {
  // RTK Query hooks
  const {
    data: stats = { pending: 0, approved: 0, rejected: 0 },
    refetch: refetchStats,
    isFetching: statsLoading,
  } = useGetLabStatsQuery()

  const {
    data: recordsData = [],
    isLoading: loading,
    isFetching: recordsFetching,
    refetch: refetchRecords,
  } = useGetPendingLabQuery()

  const [approveLab] = useApproveLabMutation()
  const [rejectLab] = useRejectLabMutation()

  // Toolbar State - same as Faculty Dashboard
  const [searchTerm, setSearchTerm] = useState("")
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("All")

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modal State
  const [expandedRow, setExpandedRow] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [returnedItemsInput, setReturnedItemsInput] = useState([])
  const [issuesInput, setIssuesInput] = useState("None")
  const [currentGroupId, setCurrentGroupId] = useState(null)
  const [loadingApproveId, setLoadingApproveId] = useState(null)
  const [socket, setSocket] = useState(null)

  // Transform records data
  const records = Array.isArray(recordsData) ? recordsData : []

  // Socket setup
  useEffect(() => {
    const newSocket = io("http://localhost:5000")
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("✅ Lab Socket connected:", newSocket.id)
    })

    newSocket.on("lab:new-eligible", () => {
      console.log("📡 New lab request received")
      refetchRecords()
      refetchStats()
      toast.info("🔬 New group ready for Lab clearance!")
    })

    return () => {
      newSocket.disconnect()
    }
  }, [refetchRecords, refetchStats])

  // Filter and pagination logic - exactly like Faculty Dashboard
  const filteredRecords = records.filter((rec) => {
    const normalized = searchTerm.toLowerCase().replace(/\s+/g, "")
    const groupNumber = String(rec.groupId?.groupNumber || "")
      .trim()
      .toLowerCase()
    const fullGroup = `group${groupNumber}`.replace(/\s+/g, "")
    const title = (rec.groupId?.projectTitle || "").toLowerCase()

    const matchExact = normalized === groupNumber
    const matchFull = normalized === fullGroup
    const includes = fullGroup.includes(normalized) || groupNumber.includes(normalized)
    const matchTitle = title.includes(normalized)
    const matchStudent = rec.members?.some((m) =>
      `${m.fullName} ${m.studentId}`.toLowerCase().replace(/\s+/g, "").includes(normalized),
    )

    const matchesSearch = matchExact || matchFull || includes || matchTitle || matchStudent
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

  const handleApproveWithItems = async (manualGroupId = null) => {
    const groupId = manualGroupId || currentGroupId
    const currentRecord = records.find((p) => p.groupId._id === groupId)
    const expectedItems = currentRecord?.expectedItems || []

    const allReturned =
      expectedItems.length === 0 ||
      expectedItems.every((item) => returnedItemsInput.map((i) => i.toLowerCase()).includes(item.toLowerCase()))

    if (loadingApproveId) return
    setLoadingApproveId(groupId)

    try {
      const approvedBy = localStorage.getItem("userId") || "System"
      const payload = {
        groupId,
        approvedBy,
        returnedItems: returnedItemsInput,
        issues: allReturned
          ? "None"
          : `Missing: ${expectedItems.filter((i) => !returnedItemsInput.includes(i)).join(", ")}`,
      }

      await approveLab(payload).unwrap()

      setShowApproveModal(false)
      toast.success(allReturned ? "✅ Approved" : "⚠ Marked Incomplete")
    } catch (err) {
      console.error("❌ Approval failed:", err)
      toast.error(err?.data?.message || "Error during approval.")
    } finally {
      setLoadingApproveId(null)
      setShowApproveModal(false)
      setCurrentGroupId(null)
      setReturnedItemsInput([])
      setIssuesInput("None")
      setExpandedRow(null)
    }
  }

  const handleReject = async (groupId) => {
    const issues = prompt("Enter reason for rejection:")
    if (!issues) return

    try {
      await rejectLab({ groupId, issues }).unwrap()
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

  const canReject = (rec) => {
    const hasExpected = (rec.expectedItems?.length || 0) > 0
    let returned = []
    if (Array.isArray(rec.returnedItems)) {
      returned = rec.returnedItems.map((i) => i.trim()).filter(Boolean)
    } else if (typeof rec.returnedItems === "string") {
      returned = rec.returnedItems
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean)
    }
    return hasExpected && returned.length === 0
  }

  // Check if any data is loading/fetching
  const isAnyLoading = loading || recordsFetching || statsLoading || isRefreshing

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <h2>🔬 Lab Dashboard 👋</h2>

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

        {/* Lab Clearance Requests Section */}
        <div className="requests-section">
          <h3>📝 Lab Clearance Requests</h3>

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
                  <option value="Incomplete">Incomplete</option>
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
                <th>Returned Items</th>
                <th>Status</th>
                <th>Issues</th>
                <th>Actions</th>
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
                        {(rec.expectedItems?.length || 0) === 0 ? (
                          <span className="badge badge-info">Not Required</span>
                        ) : (
                          (() => {
                            const returned = Array.isArray(rec.returnedItems)
                              ? rec.returnedItems.map((i) => i.trim().toLowerCase()).filter((i) => i !== "")
                              : (rec.returnedItems || "")
                                  .split(",")
                                  .map((i) => i.trim().toLowerCase())
                                  .filter((i) => i !== "")
                            if (returned.length === 0) {
                              return <span className="badge rejected">Not Returned</span>
                            }
                            return <span className="badge approved">{returned.filter((i) => i).join(", ")}</span>
                          })()
                        )}
                      </td>
                      <td>
                        <span className={`badge ${rec.status.toLowerCase()}`}>{rec.status}</span>
                      </td>
                      <td>{rec.issues || "—"}</td>
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
                              <strong>📋 Members:</strong>
                            </p>
                            <ul>
                              {rec.members?.map((m) => (
                                <li key={m._id}>
                                  {m.fullName} ({m.studentId})
                                </li>
                              ))}
                            </ul>
                            <p>
                              <strong>Expected Items:</strong> {rec.expectedItems?.join(", ") || "—"}
                            </p>
                            <p>
                              <strong>Returned Items:</strong>{" "}
                              {Array.isArray(rec.returnedItems)
                                ? rec.returnedItems.join(", ")
                                : rec.returnedItems || "❌ None returned"}
                            </p>
                            <p>
                              <strong>Issues:</strong> {rec.issues || "—"}
                            </p>
                            <div style={{ marginTop: "10px" }}>
                              <button
                                className="btn-approve"
                                onClick={() => {
                                  if ((rec.expectedItems || []).length === 0) {
                                    handleApproveWithItems(rec.groupId._id)
                                  } else {
                                    setCurrentGroupId(rec.groupId._id)
                                    setReturnedItemsInput(rec.returnedItems || [])
                                    setIssuesInput("None")
                                    setShowApproveModal(true)
                                  }
                                }}
                                disabled={
                                  loadingApproveId === rec.groupId._id || ["Approved", "Rejected"].includes(rec.status)
                                }
                              >
                                {loadingApproveId === rec.groupId._id ? "Approving..." : "✅ Approve"}
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => handleReject(rec.groupId._id)}
                                style={{ marginLeft: "10px" }}
                                disabled={!canReject(rec)}
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

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>✅ Select Returned Items</h3>
            <div className="checklist-container">
              {(records.find((p) => p.groupId._id === currentGroupId)?.expectedItems || []).map((item, index) => (
                <div key={index} className="checklist-item">
                  <label className="checklist-label">
                    <input
                      type="checkbox"
                      checked={returnedItemsInput.map((i) => i.toLowerCase()).includes(item.toLowerCase())}
                      onChange={(e) => {
                        const updated = new Set(returnedItemsInput.map((i) => i.toLowerCase()))
                        if (e.target.checked) {
                          updated.add(item.toLowerCase())
                        } else {
                          updated.delete(item.toLowerCase())
                        }
                        const updatedArray = Array.from(updated)
                        setReturnedItemsInput(updatedArray)
                        const expected = (
                          records.find((p) => p.groupId._id === currentGroupId)?.expectedItems || []
                        ).map((i) => i.toLowerCase())
                        const allReturned = expected.every((i) => updatedArray.includes(i))
                        setIssuesInput(allReturned ? "None" : "Missing Items")
                      }}
                      className="checklist-checkbox"
                    />
                    <span className="label-text">{item}</span>
                  </label>
                </div>
              ))}
            </div>
            <textarea
              rows="3"
              value={issuesInput}
              onChange={(e) => setIssuesInput(e.target.value)}
              placeholder="Write any issues or type 'None'"
              className="reasons-textarea"
            />
            <div className="modal-actions">
              <button
                onClick={() => handleApproveWithItems()}
                disabled={loadingApproveId !== null}
                className={
                  (records.find((p) => p.groupId._id === currentGroupId)?.expectedItems || [])
                    .map((i) => i.toLowerCase())
                    .every((i) => returnedItemsInput.map((j) => j.toLowerCase()).includes(i))
                    ? "btn-complete"
                    : "btn-incomplete"
                }
              >
                {loadingApproveId !== null
                  ? "Saving..."
                  : (records.find((p) => p.groupId._id === currentGroupId)?.expectedItems || [])
                        .map((i) => i.toLowerCase())
                        .every((i) => returnedItemsInput.map((j) => j.toLowerCase()).includes(i))
                    ? "✅ Approve"
                    : "❗ Mark Incomplete"}
              </button>
              <button className="btn-cancel" onClick={() => setShowApproveModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default LabDashboard
