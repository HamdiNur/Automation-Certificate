"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import "./Dashboard.css"
import { toast, ToastContainer } from "react-toastify"

function NameCorrections() {
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionType, setActionType] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [breakdown, setBreakdown] = useState({ waitingForDocument: 0, readyForReview: 0, approved: 0, rejected: 0 })

  // ✅ NEW: Filter state
  const [showCompleted, setShowCompleted] = useState(true) // Show approved/rejected by default

  useEffect(() => {
    fetchNameCorrectionRequests()
  }, [])

  const fetchNameCorrectionRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5000/api/examination/name-correction-requests")
      const data = await response.json()

      if (response.ok) {
        setRequests(data.requests || [])
        setBreakdown(data.breakdown || { waitingForDocument: 0, readyForReview: 0, approved: 0, rejected: 0 })
      } else {
        console.error("Failed to fetch requests:", data.message)
        toast.error("Failed to fetch name correction requests")
      }
    } catch (err) {
      console.error("Failed to fetch name corrections", err)
      toast.error("Failed to fetch name correction requests")
    } finally {
      setLoading(false)
    }
  }

  // ✅ UPDATED: Only allow actions for students with uploaded documents
  const handleDecision = async (studentId, action) => {
    const request = requests.find((r) => r._id === studentId)

    // ✅ Prevent actions on students who haven't uploaded documents or are already processed
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
      let response

      if (action === "Approved") {
        response = await fetch("http://localhost:5000/api/examination/name-correction-approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId }),
        })
      } else if (action === "Rejected") {
        if (!rejectionReason.trim()) {
          toast.error("Please provide a rejection reason")
          return
        }

        response = await fetch(`http://localhost:5000/api/examination/name-correction-reject/${studentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
        })
      }

      const result = await response.json()

      if (response.ok) {
        toast.success(`✅ Name correction ${action.toLowerCase()} successfully!`)
        fetchNameCorrectionRequests() // ✅ This will now show the approved/rejected request
        setShowModal(false)
        setRejectionReason("")
        setSelectedRequest(null)
      } else {
        toast.error(`❌ Failed to ${action.toLowerCase()}: ${result.message}`)
        console.error("Failed:", result.message)
      }
    } catch (err) {
      console.error("Error processing request:", err)
      toast.error(`❌ Error processing ${action.toLowerCase()}`)
    }
  }

  const formatRequestedName = (name) => {
    if (!name) return <i style={{ color: "#888" }}>N/A</i>
    if (typeof name === "string") return name
    return `${name.firstName || ""} ${name.middleName || ""} ${name.lastName || ""}`.trim()
  }

  // ✅ UPDATED: Get status badge with all states
  const getStatusBadge = (status, actionNeeded) => {
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

  // ✅ Filter requests based on search term and completion filter
  const filteredRequests = requests.filter((req) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      req.fullName?.toLowerCase().includes(term) ||
      req.studentId?.toLowerCase().includes(term) ||
      req.requestedName?.toLowerCase().includes(term)

    // ✅ Filter by completion status
    const isCompleted = ["Approved", "Rejected"].includes(req.status)
    const matchesCompletionFilter = showCompleted || !isCompleted

    return matchesSearch && matchesCompletionFilter
  })

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <div className="dashboard-main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>📝 Name Correction Requests</h2>

          {/* ✅ UPDATED: Status breakdown with all states */}
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

        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <input
            type="text"
            placeholder="🔍 Search by name, ID, or requested name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 12px",
              width: "100%",
              maxWidth: "400px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />

          {/* ✅ NEW: Toggle to show/hide completed requests */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
              <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
              Show Completed
            </label>
          </div>

          <div style={{ color: "#666", fontSize: "14px", whiteSpace: "nowrap" }}>
            {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""} found
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div>Loading name correction requests...</div>
          </div>
        ) : (
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
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req, index) => (
                  <tr key={req._id || index}>
                    <td>{index + 1}</td>
                    <td>{req.studentId}</td>
                    <td>{req.fullName}</td>
                    <td>
                      <strong style={{ color: "#2563eb" }}>{formatRequestedName(req.requestedName)}</strong>
                    </td>
                    <td>
                      {/* ✅ Status badge with all states */}
                      {getStatusBadge(req.status, req.actionNeeded)}
                    </td>
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
                      {/* ✅ Show appropriate date based on status */}
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
                      {/* ✅ UPDATED: Show different actions based on status */}
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
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    {searchTerm
                      ? `No requests found matching "${searchTerm}"`
                      : !showCompleted
                        ? "No active requests found. Toggle 'Show Completed' to see all requests."
                        : "No name correction requests found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ✅ UPDATED: Modal with rejection reason display */}
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

                {/* ✅ Show existing rejection reason if any */}
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
                    ["Approved", "Rejected"].includes(selectedRequest.status) // ✅ Disable if already processed
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
