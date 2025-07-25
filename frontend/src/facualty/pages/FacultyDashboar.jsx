"use client"
import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import FacultySidebar from "../components/FacultySidebar"
import SkeletonTable from "../../components/loaders/skeletonTable"

import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./styling/style.css"

// RTK Query imports
import {
  useGetRequestsQuery,
  useGetCountsQuery,
  useApproveGroupMutation,
  useRejectGroupMutation,
  useMarkIncompleteMutation,
  useUpdateChecklistMutation,
} from "../../redux/slices/facultyApiSlice"

function FacultyDashboard() {
  // RTK Query hooks
  const {
    data: counts = { pending: 0, approved: 0, rejected: 0 },
    refetch: refetchCounts,
    isFetching: countsLoading,
  } = useGetCountsQuery()
  const {
    data: requestsData = [],
    isLoading: loading,
    isFetching: requestsFetching,
    refetch: refetchRequests,
  } = useGetRequestsQuery()
  const [approveGroup] = useApproveGroupMutation()
  const [rejectGroup] = useRejectGroupMutation()
  const [markIncomplete] = useMarkIncompleteMutation()
  const [updateChecklist] = useUpdateChecklistMutation()

  // Toolbar State
  const [searchTerm, setSearchTerm] = useState("")
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("All")
  const [visibleColumns, setVisibleColumns] = useState({
    status: true,
    reason: true,
    date: true,
    actions: true,
  })

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modal State
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [checklist, setChecklist] = useState({
    thesisSubmitted: false,
    formSubmitted: false,
    paperSubmitted: false,
    supervisorComments: false,
  })
  const [incompleteReasons, setIncompleteReasons] = useState("")
  const [isEditingReasons, setIsEditingReasons] = useState(false)
  const [groupToReject, setGroupToReject] = useState(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [socket, setSocket] = useState(null)

  // Transform requests data
  const requests = requestsData.map((f) => {
    const firstMember = f.groupId?.members?.[0]
    return {
      id: f._id,
      groupId: f.groupId._id,
      groupNumber: f.groupId.groupNumber,
      projectTitle: f.thesisTitle,
      status: f.status,
      date: f.updatedAt?.slice(0, 10) || "Not updated",
      rejectionReason: f.rejectionReason || "",
      studentMongoId: firstMember?._id || firstMember || "",
      printedThesisSubmitted: f.printedThesisSubmitted || false,
      signedFormSubmitted: f.signedFormSubmitted || false,
      softCopyReceived: f.softCopyReceived || false,
      supervisorCommentsWereCorrected: f.supervisorCommentsWereCorrected || false,
    }
  })

  // Socket setup
  useEffect(() => {
    const newSocket = io("http://localhost:5000")
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id)
    })

    newSocket.on("new-clearance-request", (data) => {
      console.log("📡 New faculty request received:", data)
      refetchRequests()
      refetchCounts()
      toast.info("📢 New faculty clearance request received!")
    })

    return () => {
      newSocket.disconnect()
    }
  }, [refetchRequests, refetchCounts])

  // Filter and pagination logic
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      `${r.groupNumber}`.includes(searchTerm) || r.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "All" || r.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + rowsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, rowsPerPage])

  const handleChecklistChange = (field) => {
    setChecklist((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleApprove = async (groupId) => {
    try {
      const allChecked = Object.values(checklist).every(Boolean)
      if (!allChecked) return toast.warning("Complete the checklist before approval.")

      await updateChecklist({
        groupId,
        checklist: {
          printedThesisSubmitted: checklist.thesisSubmitted,
          signedFormSubmitted: checklist.formSubmitted,
          softCopyReceived: checklist.paperSubmitted,
          supervisorCommentsWereCorrected: checklist.supervisorComments,
        },
      }).unwrap()

      await approveGroup(groupId).unwrap()
      toast.success("✅ Faculty approved.")
      setShowChecklistModal(false)
    } catch (err) {
      console.error("❌ Approval failed:", err)
      toast.error(err?.data?.message || "Error during approval.")
    }
  }

  const handleReject = async (groupId) => {
    try {
      await rejectGroup({ groupId, rejectionReason }).unwrap()
      toast.error("❌ Faculty request rejected.")
      setShowRejectModal(false)
    } catch (err) {
      console.error("❌ Rejection failed:", err)
      toast.error("Error during rejection.")
    }
  }

  const handleIncomplete = async (groupId) => {
    try {
      const uncheckedFields = Object.entries(checklist)
        .filter(([_, value]) => !value)
        .map(([key]) => key)

      if (uncheckedFields.length === 0) {
        toast.info("✅ All checklist items are checked. Use Approve instead.")
        return
      }

      await updateChecklist({
        groupId,
        checklist: {
          printedThesisSubmitted: checklist.thesisSubmitted,
          signedFormSubmitted: checklist.formSubmitted,
          softCopyReceived: checklist.paperSubmitted,
          supervisorCommentsWereCorrected: checklist.supervisorComments,
        },
      }).unwrap()

      const reasonText = `Missing: ${uncheckedFields
        .map((key) => {
          switch (key) {
            case "thesisSubmitted":
              return "Printed and soft copies"
            case "formSubmitted":
              return "Signed research form"
            case "paperSubmitted":
              return "Soft copy of paper"
            case "supervisorComments":
              return "Supervisor corrections"
            default:
              return key
          }
        })
        .join(", ")}`

      await markIncomplete({ groupId, rejectionReason: reasonText }).unwrap()
      toast.warning("⚠️ Marked as Incomplete.")
      setShowChecklistModal(false)
    } catch (err) {
      console.error("❌ Incomplete failed:", err)
      toast.error("Error saving as incomplete.")
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast.info("🔄 Refreshing table data...")

    try {
      await Promise.all([refetchRequests(), refetchCounts()])
      toast.success("✅ Table refreshed successfully!")
    } catch (error) {
      toast.error("❌ Failed to refresh data")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Check if any data is loading/fetching
  const isAnyLoading = loading || requestsFetching || countsLoading || isRefreshing

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>Welcome, Faculty Member 👋</h2>

        {/* Dashboard Stats Widgets */}
        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>Pending Requests</h3>
            <p className="pending">{counts.pending}</p>
          </div>
          <div className="widget-card">
            <h3>Approved</h3>
            <p className="approved">{counts.approved}</p>
          </div>
          <div className="widget-card">
            <h3>Rejected</h3>
            <p className="rejected">{counts.rejected}</p>
          </div>
        </div>

        {/* Faculty Clearance Requests Section */}
        <div className="requests-section">
          <h3>Faculty Clearance Requests</h3>

          {/* Toolbar - matching the image layout */}
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

              {/* All Status filter */}
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
                  placeholder={`Search ${filteredRequests.length} records...`}
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
                {visibleColumns.status && <th>Status</th>}
                {visibleColumns.date && <th>Date</th>}
                {visibleColumns.reason && <th>Reason</th>}
                {visibleColumns.actions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
            {isAnyLoading ? (
  <tr>
    <td colSpan="7">
      <SkeletonTable rows={5} cols={7} />
    </td>
  </tr>
) : paginatedRequests.length === 0 ? (

                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    {searchTerm || statusFilter !== "All"
                      ? `No requests found matching your filters`
                      : "No requests found."}
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((r, index) => (
                  <tr key={r.id}>
                    <td>{startIndex + index + 1}</td>
                    <td>Group {r.groupNumber}</td>
                    <td>{r.projectTitle}</td>
                    {visibleColumns.status && (
                      <td>
                        <span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span>
                      </td>
                    )}
                    {visibleColumns.date && <td>{r.date}</td>}
                    {visibleColumns.reason && <td>{r.rejectionReason || "—"}</td>}
                    {visibleColumns.actions && (
                      <td>
                        {r.status === "Pending" || r.status === "Incomplete" ? (
                          <>
                            <button
                              className="btn-approve"
                              onClick={() => {
                                setSelectedGroup(r)
                                if (r.status === "Incomplete") {
                                  setChecklist({
                                    thesisSubmitted: r.printedThesisSubmitted,
                                    formSubmitted: r.signedFormSubmitted,
                                    paperSubmitted: r.softCopyReceived,
                                    supervisorComments: r.supervisorCommentsWereCorrected,
                                  })
                                  setIncompleteReasons(r.rejectionReason || "")
                                } else {
                                  setChecklist({
                                    thesisSubmitted: false,
                                    formSubmitted: false,
                                    paperSubmitted: false,
                                    supervisorComments: false,
                                  })
                                  setIncompleteReasons("")
                                }
                                setIsEditingReasons(false)
                                setShowChecklistModal(true)
                              }}
                            >
                              {r.status === "Incomplete" ? "Review" : "Approve"}
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => {
                                setGroupToReject(r)
                                setRejectionReason("")
                                setShowRejectModal(true)
                              }}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                  </tr>
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
                Page {currentPage} of {totalPages} ({filteredRequests.length} total)
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

      {/* Checklist Modal */}
      {showChecklistModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Faculty Clearance Checklist - Group {selectedGroup.groupNumber}</h3>

            {/* Improved Checklist Design */}
            <div className="checklist-container">
              {[
                ["thesisSubmitted", "Printed and soft copies submitted"],
                ["formSubmitted", "Signed research form submitted"],
                ["paperSubmitted", "Soft copy of paper submitted"],
                ["supervisorComments", "Supervisor corrections made"],
              ].map(([field, label]) => (
                <div key={field} className="checklist-item">
                  <label className="checklist-label">
                    <input
                      type="checkbox"
                      checked={checklist[field]}
                      onChange={() => handleChecklistChange(field)}
                      className="checklist-checkbox"
                    />
                    <span className="checkmark"></span>
                    <span className="label-text">{label}</span>
                  </label>
                </div>
              ))}
            </div>

            {/* Incomplete Reasons Section */}
            {selectedGroup.status === "Incomplete" && (
              <div className="incomplete-reasons">
                <h4>Previous Incomplete Reasons:</h4>
                {isEditingReasons ? (
                  <textarea
                    value={incompleteReasons}
                    onChange={(e) => setIncompleteReasons(e.target.value)}
                    className="reasons-textarea"
                    placeholder="Edit reasons..."
                  />
                ) : (
                  <div className="reasons-display">{incompleteReasons || "No reasons provided"}</div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              {Object.values(checklist).every(Boolean) && (
                <button className="btn-complete" onClick={() => handleApprove(selectedGroup.groupId)}>
                  ✅ Complete & Approve
                </button>
              )}

              {!Object.values(checklist).every(Boolean) && (
                <button className="btn-incomplete" onClick={() => handleIncomplete(selectedGroup.groupId)}>
                  ⚠️ Mark Incomplete
                </button>
              )}

              <button className="btn-cancel" onClick={() => setShowChecklistModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && groupToReject && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reject Request</h3>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason..."
              className="reject-textarea"
            />
            <div className="modal-actions">
              <button
                className="btn-confirm"
                disabled={!rejectionReason.trim()}
                onClick={() => handleReject(groupToReject.groupId)}
              >
                Confirm Reject
              </button>
              <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>
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

export default FacultyDashboard
