import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

function NameCorrections() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [actionType, setActionType] = useState("");

  // ✅ Fetch name correction requests on load
  useEffect(() => {
    fetch("http://localhost:5000/api/students?nameCorrectionRequested=true")
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Failed to fetch name corrections", err));
  }, []);

  // ✅ Approve or reject logic
  const handleDecision = async (studentId, status) => {
    try {
      const url = `http://localhost:5000/api/students/${status === "Approved" ? "approve-name" : "reject-name"}/${studentId}`;
      const res = await fetch(url, { method: "PUT" });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === studentId
              ? { ...r, nameVerified: status === "Approved", nameCorrectionRequested: false }
              : r
          )
        );
        setShowModal(false);
        setRemarks("");
        setSelectedRequest(null);
      } else {
        const errData = await res.json();
        console.error("Failed:", errData.message || "Unknown error");
      }
    } catch (err) {
      console.error("Error processing request:", err);
    }
  };

  const formatRequestedName = (name) => {
    if (!name) return <i style={{ color: "#888" }}>N/A</i>;
    if (typeof name === "string") return name;
    return `${name.firstName || ""} ${name.middleName || ""} ${name.lastName || ""}`.trim();
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
              <th>Student Name</th>
              <th>Requested Name</th>
              <th>Document</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, index) => (
              <tr key={req._id || index}>
                <td>{req.studentId}</td>
                <td>{req.fullName}</td>
                <td>{formatRequestedName(req.requestedName)}</td>
                <td>
                  {req.correctionUploadUrl ? (
                    <a
                      href={`http://localhost:5000/${req.correctionUploadUrl}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Document
                    </a>
                  ) : (
                    <i style={{ color: "#999" }}>No document</i>
                  )}
                </td>
                <td>
                  <span className={`badge ${req.nameVerified ? "approved" : "pending"}`}>
                    {req.nameVerified ? "Approved" : "Pending"}
                  </span>
                </td>
                <td>
                  {req.nameVerified ? (
                    <span style={{ color: "#aaa" }}>—</span>
                  ) : (
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
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ✅ Modal for confirmation */}
        {showModal && selectedRequest && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{actionType} Name Correction</h3>
              <p>
                <strong>Student:</strong> {selectedRequest.fullName} <br />
                <strong>Requested Name:</strong> {formatRequestedName(selectedRequest.requestedName)} <br />
                <strong>Document:</strong>{" "}
                {selectedRequest.correctionUploadUrl ? (
                  <a
                    href={`http://localhost:5000/${selectedRequest.correctionUploadUrl}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Document
                  </a>
                ) : (
                  <i style={{ color: "#888" }}>No document</i>
                )}
              </p>

              {actionType === "Rejected" && (
                <textarea
                  placeholder="Enter rejection reason (optional)"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{ width: "100%", marginTop: "10px", padding: "10px" }}
                />
              )}

              <div className="modal-buttons" style={{ marginTop: "20px" }}>
                <button
                  className="btn-confirm"
                  onClick={() => handleDecision(selectedRequest._id, actionType)}
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
