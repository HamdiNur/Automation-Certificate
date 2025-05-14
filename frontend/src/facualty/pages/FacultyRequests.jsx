import React, { useState } from "react";
import FacultySidebar from "../components/FacultySidebar";
import "./styling/style.css"

const sampleRequests = [
  {
    id: 1,
    student: "Group 12 - Computer Science",
    type: "Group",
    projectTitle: "Smart Clearance System",
    status: "Pending",
    date: "2025-05-13",
  },
  {
    id: 2,
    student: "Group 3 - Accounting",
    type: "Group",
    projectTitle: "Audit App",
    status: "Approved",
    date: "2025-05-10",
  },
  {
    id: 3,
    student: "Group 7 - Engineering",
    type: "Group",
    projectTitle: "Bridge Load Estimator",
    status: "Rejected",
    date: "2025-05-09",
    rejectionReason: "Project was incomplete",
  },
];

function FacultyRequests() {
  const [requests, setRequests] = useState(sampleRequests);
  const [searchTerm, setSearchTerm] = useState("");

  // Approval checklist modal
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [checklist, setChecklist] = useState({
    thesisSubmitted: false,
    formSubmitted: false,
    paperSubmitted: false,
  });

  // Rejection confirmation modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [groupToReject, setGroupToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (id) => {
    const updated = requests.map((req) =>
      req.id === id ? { ...req, status: "Approved" } : req
    );
    setRequests(updated);
    setShowChecklistModal(false);
    setSelectedGroup(null);
  };

  const handleReject = (id) => {
    const updated = requests.map((req) =>
      req.id === id
        ? { ...req, status: "Rejected", rejectionReason }
        : req
    );
    setRequests(updated);
    setShowRejectModal(false);
    setGroupToReject(null);
    setRejectionReason("");
  };

  const filtered = requests.filter((r) =>
    r.student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>Faculty Clearance Requests</h2>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by group or project title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Project Title</th>
              <th>Status</th>
              <th>Date</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.student}</td>
                <td>{r.projectTitle}</td>
                <td>
                  <span className={`badge ${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                </td>
                <td>{r.date}</td>
                <td>{r.status === "Rejected" ? r.rejectionReason : "—"}</td>
                <td>
                  {r.status === "Pending" ? (
                    <>
                      <button
                        className="btn-approve"
                        onClick={() => {
                          setSelectedGroup(r);
                          setChecklist({
                            thesisSubmitted: false,
                            formSubmitted: false,
                            paperSubmitted: false,
                          });
                          setShowChecklistModal(true);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => {
                          setGroupToReject(r);
                          setRejectionReason("");
                          setShowRejectModal(true);
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#777" }}>
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Approval Checklist Modal */}
      {showChecklistModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Faculty Clearance Checklist</h3>

            <label>
              <input
                type="checkbox"
                checked={checklist.thesisSubmitted}
                onChange={() =>
                  setChecklist((prev) => ({
                    ...prev,
                    thesisSubmitted: !prev.thesisSubmitted,
                  }))
                }
              />
              Printed and soft copies of thesis submitted to faculty
            </label>

            <label>
              <input
                type="checkbox"
                checked={checklist.formSubmitted}
                onChange={() =>
                  setChecklist((prev) => ({
                    ...prev,
                    formSubmitted: !prev.formSubmitted,
                  }))
                }
              />
              Submission of Signed Research Final Submission Form
            </label>

            <label>
              <input
                type="checkbox"
                checked={checklist.paperSubmitted}
                onChange={() =>
                  setChecklist((prev) => ({
                    ...prev,
                    paperSubmitted: !prev.paperSubmitted,
                  }))
                }
              />
              Submission of soft copy of the research paper
            </label>

            <div className="modal-buttons" style={{ marginTop: "20px" }}>
              <button
                className="btn-confirm"
                disabled={
                  !checklist.thesisSubmitted ||
                  !checklist.formSubmitted ||
                  !checklist.paperSubmitted
                }
                onClick={() => handleApprove(selectedGroup.id)}
              >
                Approve
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowChecklistModal(false);
                  setSelectedGroup(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❌ Rejection Modal with Reason */}
      {showRejectModal && groupToReject && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reject Request</h3>
            <p>
              Please provide a reason for rejecting{" "}
              <strong>{groupToReject.student}</strong>’s request:
            </p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={{ width: "100%", marginTop: "10px", padding: "10px" }}
            ></textarea>

            <div className="modal-buttons" style={{ marginTop: "20px" }}>
              <button
                className="btn-confirm"
                disabled={!rejectionReason.trim()}
                onClick={() => handleReject(groupToReject.id)}
              >
                Confirm Reject
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowRejectModal(false);
                  setGroupToReject(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyRequests;
