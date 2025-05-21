import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const sampleRequests = [
  {
    id: 1,
    studentId: "STD001",
    oldName: "Amina Yusuf Ali",
    requestedName: {
      firstName: "Amina",
      middleName: "Yusuf",
      lastName: "Mohamed"
    },
    documentUrl: "/documents/passport_amina.jpg", // use public folder or fake path
    status: "Pending",
    submittedAt: "2025-05-12"
  },
  {
    id: 2,
    studentId: "STD002",
    oldName: "Mohamed Abdi",
    requestedName: {
      firstName: "Mohamed",
      middleName: "Abdi",
      lastName: "Farah"
    },
    documentUrl: "/documents/passport_mohamed.jpg",
    status: "Pending",
    submittedAt: "2025-05-13"
  }
];

function NameCorrections() {
  const [requests, setRequests] = useState(sampleRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [actionType, setActionType] = useState(""); // approve or reject

  const handleDecision = (id, status) => {
    const updated = requests.map((r) =>
      r.id === id ? { ...r, status, remarks: status === "Rejected" ? remarks : "" } : r
    );
    setRequests(updated);
    setShowModal(false);
    setRemarks("");
    setSelectedRequest(null);
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <h2>Student Name Correction Requests</h2>

        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Old Name</th>
              <th>Requested Name</th>
              <th>Document</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.studentId}</td>
                <td>{req.oldName}</td>
                <td>
                  {req.requestedName.firstName} {req.requestedName.middleName} {req.requestedName.lastName}
                </td>
                <td>
                  <a href={req.documentUrl} target="_blank" rel="noopener noreferrer">
                    View Document
                  </a>
                </td>
                <td>
                  <span className={`badge ${req.status.toLowerCase()}`}>{req.status}</span>
                </td>
                <td>
                  {req.status === "Pending" ? (
                    <>
                      <button
                        className="btn-approve"
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionType("Approved");
                          setShowModal(true);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionType("Rejected");
                          setShowModal(true);
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
          </tbody>
        </table>

        {/* ✅ Approve/Reject Modal */}
        {showModal && selectedRequest && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>
                {actionType === "Approved" ? "Approve" : "Reject"} Name Correction
              </h3>
              <p>
                <strong>Old Name:</strong> {selectedRequest.oldName}<br />
                <strong>Requested Name:</strong>{" "}
                {selectedRequest.requestedName.firstName}{" "}
                {selectedRequest.requestedName.middleName}{" "}
                {selectedRequest.requestedName.lastName}
              </p>
              <p>
                <strong>Document:</strong>{" "}
                <a
                  href={selectedRequest.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Document
                </a>
              </p>

              {actionType === "Rejected" && (
                <textarea
                  placeholder="Enter reason for rejection (optional)"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{ width: "100%", marginTop: "10px", padding: "10px" }}
                ></textarea>
              )}

              <div className="modal-buttons" style={{ marginTop: "20px" }}>
                <button
                  className="btn-confirm"
                  onClick={() => handleDecision(selectedRequest.id, actionType)}
                >
                  Confirm {actionType}
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                    setRemarks("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NameCorrections;
