"use client"

import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import axios from "axios"
import FacultySidebar from "../components/FacultySidebar"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./styling/style.css"

function FacultyDashboard() {
  // Dashboard Stats State
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  // Requests State
  const [requests, setRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [checklist, setChecklist] = useState({
    thesisSubmitted: false,
    formSubmitted: false,
    paperSubmitted: false,
    supervisorComments: false,
  })
  const [groupToReject, setGroupToReject] = useState(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const [socket, setSocket] = useState(null)
  const token = localStorage.getItem("token")

  // Fetch Dashboard Stats
  const fetchCounts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/faculty/status-count")
      setCounts(res.data)
    } catch (err) {
      console.error("❌ Error fetching dashboard counts:", err.message)
    }
  }

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await axios.get("http://localhost:5000/api/faculty/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setRequests(
        res.data.map((f) => {
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
          }
        }),
      )
    } catch (err) {
      console.error("❌ Error fetching requests:", err.response?.data || err.message)
      toast.error("⚠️ Failed to load faculty requests.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const newSocket = io("http://localhost:5000")
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id)
    })

    newSocket.on("new-clearance-request", (data) => {
      console.log("📡 New faculty request received:", data)
      fetchRequests()
      fetchCounts() // Refresh stats when new request comes in
      toast.info("📢 New faculty clearance request received!")
    })

    fetchCounts()
    fetchRequests()

    return () => {
      newSocket.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChecklistChange = (field) => {
    setChecklist((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleApprove = async (groupId) => {
    try {
      const allChecked = Object.values(checklist).every(Boolean)
      if (!allChecked) return toast.warning("Complete the checklist before approval.")

      await axios.patch(
        "http://localhost:5000/api/faculty/update-checklist",
        {
          groupId,
          checklist: {
            printedThesisSubmitted: checklist.thesisSubmitted,
            signedFormSubmitted: checklist.formSubmitted,
            softCopyReceived: checklist.paperSubmitted,
            supervisorCommentsWereCorrected: checklist.supervisorComments,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      await axios.post(
        "http://localhost:5000/api/faculty/approve",
        {
          groupId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      toast.success("✅ Faculty approved.")
      fetchRequests()
      fetchCounts() // Refresh stats after approval
      setShowChecklistModal(false)
    } catch (err) {
      console.error("❌ Approval failed:", err?.response?.data || err.message)
      toast.error(err?.response?.data?.message || "Error during approval.")
    }
  }

  const handleReject = async (groupId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/faculty/reject",
        {
          groupId,
          rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      toast.error("❌ Faculty request rejected.")
      fetchRequests()
      fetchCounts() // Refresh stats after rejection
      setShowRejectModal(false)
    } catch (err) {
      console.error("❌ Rejection failed:", err)
      toast.error("Error during rejection.")
    }
  }

  const filtered = requests.filter(
    (r) => `${r.groupNumber}`.includes(searchTerm) || r.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>Welcome, Faculty Member 👋</h2>

        {/* Dashboard Stats Widgets */}
        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>⏳ Pending Requests</h3>
            <p className="pending">{counts.pending}</p>
          </div>
          <div className="widget-card">
            <h3> ✅ Approved</h3>
            <p className="approved">{counts.approved}</p>
          </div>
          <div className="widget-card">
            <h3>❌ Rejected</h3>
            <p className="rejected">{counts.rejected}</p>
          </div>
        </div>

        {/* Faculty Clearance Requests Section */}
        <div className="requests-section">
          <h3>Faculty Clearance Requests</h3>
          <div className="filter-bar">
            <input
              type="text"
              placeholder="🔍 Search by group number or project title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Group</th>
                <th>Project Title</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    <div className="spinner"></div>
                    <p>Loading faculty requests...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    {searchTerm ? `No requests found matching "${searchTerm}"` : "No requests found."}
                  </td>
                </tr>
              ) : (
                filtered.map((r, index) => (
                  <tr key={r.id}>
                    <td>{index + 1}</td>
                    <td>Group {r.groupNumber}</td>
                    <td>{r.projectTitle}</td>
                    <td>
                      <span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                    <td>{r.date}</td>
                    <td>{r.rejectionReason || "—"}</td>
                    <td>
                      {r.status === "Pending" ? (
                        <>
                          <button
                            className="btn-approve"
                            onClick={() => {
                              setSelectedGroup(r)
                              setChecklist({
                                thesisSubmitted: false,
                                formSubmitted: false,
                                paperSubmitted: false,
                                supervisorComments: false,
                              })
                              setShowChecklistModal(true)
                            }}
                          >
                            Approve
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checklist Modal */}
      {showChecklistModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Faculty Clearance Checklist</h3>
            {[
              ["thesisSubmitted", "Printed and soft copies submitted"],
              ["formSubmitted", "Signed research form submitted"],
              ["paperSubmitted", "Soft copy of paper submitted"],
              ["supervisorComments", "Supervisor corrections made"],
            ].map(([field, label]) => (
              <div key={field}>
                <label>
                  <input type="checkbox" checked={checklist[field]} onChange={() => handleChecklistChange(field)} />{" "}
                  {label}
                </label>
              </div>
            ))}
            <button
              className="btn-confirm"
              disabled={!Object.values(checklist).every(Boolean)}
              onClick={() => handleApprove(selectedGroup.groupId, selectedGroup.studentMongoId)}
            >
              Approve
            </button>
            <button className="btn-cancel" onClick={() => setShowChecklistModal(false)}>
              Cancel
            </button>
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
              style={{ width: "100%" }}
            />
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
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default FacultyDashboard
