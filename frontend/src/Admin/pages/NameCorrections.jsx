"use client"
import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import Sidebar from "../components/Sidebar"
import SkeletonTable from "../../components/loaders/skeletonTable"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./Dashboard.css"

// RTK Query imports
import {
  useGetNameCorrectionRequestsQuery,
  useApproveNameCorrectionMutation,
  useRejectNameCorrectionMutation,
} from "../../redux/api/nameCorrectionApiSlice"

function NameCorrections() {
  // Toolbar State
  const [searchTerm, setSearchTerm] = useState("")
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("All")

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionType, setActionType] = useState("")

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [socket, setSocket] = useState(null)

  // RTK Query hooks
  const {
    data: requestsData = {
      requests: [],
      breakdown: { waitingForDocument: 0, readyForReview: 0, approved: 0, rejected: 0 },
    },
    isLoading: loading,
    isFetching: requestsFetching,
    refetch: refetchRequests,
  } = useGetNameCorrectionRequestsQuery({
    search: searchTerm,
    page: currentPage,
    limit: rowsPerPage,
    status: statusFilter,
  })

  const [approveNameCorrection] = useApproveNameCorrectionMutation()
  const [rejectNameCorrection] = useRejectNameCorrectionMutation()

  const { requests, breakdown } = requestsData

  // Socket setup
  useEffect(() => {
    const newSocket = io("http://localhost:5000")
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id)
    })

    newSocket.on("nameCorrectionDocumentUploaded", (data) => {
      console.log("📄 Document uploaded:", data)
      refetchRequests()
      toast.info(`📄 ${data.fullName} uploaded a document for review`)
    })

    newSocket.on("nameCorrectionRequested", (data) => {
      console.log("📝 Name correction requested:", data)
      refetchRequests()
      toast.info(`📝 ${data.fullName} requested name correction`)
    })

    newSocket.on("nameCorrection:new-pending", (data) => {
      console.log("⏳ New pending request:", data)
      refetchRequests()
      toast.info(`⏳ New name correction request from ${data.fullName}`)
    })

    newSocket.on("nameCorrectionApproved", (data) => {
      toast.success(`✅ Name correction approved for ${data.fullName}`)
      refetchRequests()
    })

    return () => {
      newSocket.disconnect()
    }
  }, [refetchRequests])

  // Filter and pagination logic
  const filteredRequests = requests.filter((req) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      req.fullName?.toLowerCase().includes(term) ||
      req.studentId?.toLowerCase().includes(term) ||
      req.requestedName?.toLowerCase().includes(term)

    const matchesStatus = statusFilter === "All" || req.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + rowsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, rowsPerPage])

  const handleDecision = async (studentId, action) => {
    const request = requests.find((r) => r._id === studentId)

    // Prevent actions on students who haven't uploaded documents or are already processed
    if (request?.status === "Pending") {
      toast.warning("⏳ Student hasn't uploaded document yet. Cannot take action.")
      return
    }

    if (request?.status === "Approved") {
      toast.info("✅ This request has already been approved.")
      return
    }

    if (request?.status === "Rejected") {
      toast.info("❌ This request has already been rejected.")
      return
    }

    try {
      if (action === "Approved") {
        await approveNameCorrection({ studentId }).unwrap()
        toast.success("✅ Name correction approved successfully!")
      } else if (action === "Rejected") {
        if (!rejectionReason.trim()) {
          toast.error("Please provide a rejection reason")
          return
        }
        await rejectNameCorrection({ studentId, rejectionReason: rejectionReason.trim() }).unwrap()
        toast.success("❌ Name correction rejected successfully!")
      }

      setShowModal(false)
      setRejectionReason("")
      setSelectedRequest(null)
    } catch (err) {
      console.error("Error processing request:", err)
      toast.error(`❌ Failed to ${action.toLowerCase()}: ${err?.data?.message || err.message}`)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast.info("🔄 Refreshing data...")
    try {
      await refetchRequests()
      toast.success("✅ Data refreshed successfully!")
    } catch (error) {
      toast.error("❌ Failed to refresh data")
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatRequestedName = (name) => {
    if (!name) return <i style={{ color: "#888" }}>N/A</i>
    if (typeof name === "string") return name
    return `${name.firstName || ""} ${name.middleName || ""} ${name.lastName || ""}`.trim()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="badge badge-warning">⏳ Waiting for Document</span>
      case "Document Uploaded":
        return <span className="badge badge-info">📄 Ready for Review</span>
      case "Approved":
        return <span className="badge badge-success">✅ Approved</span>
      case "Rejected":
        return <span className="badge badge-danger">❌ Rejected</span>
      default:
        return <span className="badge badge-gray">❓ {status}</span>
    }
  }

  // Check if any data is loading/fetching
  const isAnyLoading = loading || requestsFetching || isRefreshing

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>📝 Name Correction Requests</h2>
          {/* Keep existing status breakdown */}
          <div style={{ display: "flex", gap: "12px", fontSize: "13px", flexWrap: "wrap" }}>
            <div
              style={{
                padding: "6px 10px",
                backgroundColor: "#fef3c7",
                borderRadius: "6px",
                border: "1px solid #f59e0b",
              }}
            >
              ⏳ Waiting: <strong>{breakdown.waitingForDocument}</strong>
            </div>
            <div
              style={{
                padding: "6px 10px",
                backgroundColor: "#dbeafe",
                borderRadius: "6px",
                border: "1px solid #3b82f6",
              }}
            >
              📄 Review: <strong>{breakdown.readyForReview}</strong>
            </div>
            <div
              style={{
                padding: "6px 10px",
                backgroundColor: "#d1fae5",
                borderRadius: "6px",
                border: "1px solid #10b981",
              }}
            >
              ✅ Approved: <strong>{breakdown.approved}</strong>
            </div>
            <div
              style={{
                padding: "6px 10px",
                backgroundColor: "#fee2e2",
                borderRadius: "6px",
                border: "1px solid #ef4444",
              }}
            >
              ❌ Rejected: <strong>{breakdown.rejected}</strong>
            </div>
          </div>
        </div>

        {/* Requests Section */}
        <div className="requests-section">
          <h3>Name Correction Requests</h3>

          {/* Toolbar */}
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
                  <option value="Document Uploaded">Ready for Review</option>
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
                <th>Student ID</th>
                <th>Current Name</th>
                <th>Requested Name</th>
                <th>Status</th>
                <th>Document</th>
                <th>Date</th>
                <th>Waiting Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isAnyLoading ? (
                <tr>
                  <td colSpan="9">
                    <SkeletonTable rows={5} cols={9} />
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    {searchTerm || statusFilter !== "All"
                      ? `No requests found matching your filters`
                      : "No name correction requests found"}
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req, index) => (
                  <tr key={req._id || index}>
                    <td>{startIndex + index + 1}</td>
                    <td>{req.studentId}</td>
                    <td>{req.fullName}</td>
                    <td>
                      <strong style={{ color: "#2563eb" }}>{formatRequestedName(req.requestedName)}</strong>
                    </td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>
                      {req.documentUrl ? (
                        <a
                          href={`http://localhost:5000/${req.documentUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", textDecoration: "none" }}
                        >
                          📄 View Document
                        </a>
                      ) : (
                        <i style={{ color: "#999" }}>No document</i>
                      )}
                    </td>
                    <td>
                      {req.processedAt
                        ? new Date(req.processedAt).toLocaleDateString()
                        : req.uploadedAt
                          ? new Date(req.uploadedAt).toLocaleDateString()
                          : "-"}
                    </td>
                    <td>
                      <span
                        className={`badge ${req.waitingTime > 7 ? "badge-danger" : req.waitingTime > 3 ? "badge-warning" : "badge-info"}`}
                      >
                        {req.waitingTime} day{req.waitingTime !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td>
                      {req.status === "Pending" ? (
                        <span style={{ color: "#666", fontSize: "12px", fontStyle: "italic" }}>
                          Waiting for document...
                        </span>
                      ) : req.status === "Document Uploaded" ? (
                        <>
                          <button
                            className="btn-approve"
                            onClick={() => {
                              setSelectedRequest(req)
                              setActionType("Approved")
                              setShowModal(true)
                            }}
                            style={{ marginRight: "8px" }}
                          >
                            ✅ Approve
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => {
                              setSelectedRequest(req)
                              setActionType("Rejected")
                              setShowModal(true)
                            }}
                          >
                            ❌ Reject
                          </button>
                        </>
                      ) : req.status === "Approved" ? (
                        <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "500" }}>✅ Completed</span>
                      ) : req.status === "Rejected" ? (
                        <div style={{ fontSize: "12px" }}>
                          <div style={{ color: "#ef4444", fontWeight: "500", marginBottom: "2px" }}>❌ Rejected</div>
                          {req.rejectionReason && (
                            <div
                              style={{
                                color: "#666",
                                fontSize: "11px",
                                maxWidth: "150px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={req.rejectionReason}
                            >
                              {req.rejectionReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#666", fontSize: "12px" }}>No action available</span>
                      )}
                    </td>
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

        {/* Modal */}
        {showModal && selectedRequest && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{actionType === "Approved" ? "✅ Approve" : "❌ Reject"} Name Correction</h3>
              <div style={{ marginBottom: "20px" }}>
                <p>
                  <strong>Student:</strong> {selectedRequest.fullName}
                </p>
                <p>
                  <strong>Student ID:</strong> {selectedRequest.studentId}
                </p>
                <p>
                  <strong>Current Name:</strong> {selectedRequest.fullName}
                </p>
                <p>
                  <strong>Requested Name:</strong>
                  <span style={{ color: "#2563eb", fontWeight: "bold" }}>
                    {" " + formatRequestedName(selectedRequest.requestedName)}
                  </span>
                </p>
                <p>
                  <strong>Status:</strong> {getStatusBadge(selectedRequest.status)}
                </p>
                <p>
                  <strong>Document:</strong>{" "}
                  {selectedRequest.documentUrl ? (
                    <a
                      href={`http://localhost:5000/${selectedRequest.documentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563eb" }}
                    >
                      📄 View Document
                    </a>
                  ) : (
                    <i style={{ color: "#888" }}>No document</i>
                  )}
                </p>
                {selectedRequest.rejectionReason && (
                  <p>
                    <strong>Previous Rejection Reason:</strong>
                    <span style={{ color: "#ef4444", fontStyle: "italic" }}>
                      {" " + selectedRequest.rejectionReason}
                    </span>
                  </p>
                )}
              </div>

              {actionType === "Rejected" && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                    Rejection Reason: <span style={{ color: "red" }}>*</span>
                  </label>
                  <textarea
                    placeholder="Please provide a clear reason for rejection (minimum 10 characters)..."
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      resize: "vertical",
                    }}
                  />
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    {rejectionReason.length}/10 characters minimum
                  </div>
                </div>
              )}

              <div className="modal-buttons" style={{ marginTop: "20px" }}>
                <button
                  className={actionType === "Approved" ? "btn-confirm" : "btn-reject"}
                  onClick={() => handleDecision(selectedRequest._id, actionType)}
                  disabled={
                    (actionType === "Rejected" && rejectionReason.trim().length < 10) ||
                    ["Approved", "Rejected"].includes(selectedRequest.status)
                  }
                >
                  Confirm {actionType}
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedRequest(null)
                    setRejectionReason("")
                  }}
                >
                  Cancel
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

export default NameCorrections
