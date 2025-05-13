import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const sampleRequests = [
  { id: 1, student: "Amina Yusuf", type: "Group", dept: "Faculty", status: "Pending", date: "2025-05-01" },
  { id: 2, student: "Mohamed Ali", type: "Individual", dept: "Finance", status: "Pending", date: "2025-05-03" },
  { id: 3, student: "Fatima Ahmed", type: "Group", dept: "Library", status: "Approved", date: "2025-04-28" },
  { id: 4, student: "Ahmed Ibrahim", type: "Group", dept: "Finance", status: "Rejected", date: "2025-05-05" },
];

function Requests() {
  const [requests, setRequests] = useState(sampleRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const handleApprove = (id) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "Approved" } : req))
    );
  };

  const handleReject = (id) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "Rejected" } : req))
    );
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.student.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <h2>Clearance Requests</h2>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Type</th>
              <th>Department</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((item) => (
              <tr key={item.id}>
                <td>{item.student}</td>
                <td>{item.type}</td>
                <td>{item.dept}</td>
                <td>
                  <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                </td>
                <td>{item.date}</td>
                <td>
                  {item.status === "Pending" && (
                    <>
                      <button
                        className="btn-approve"
                        onClick={() => {
                          setSelectedRequest(item);
                          setModalAction("approve");
                          setShowModal(true);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => {
                          setSelectedRequest(item);
                          setModalAction("reject");
                          setShowModal(true);
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    className="btn-view"
                    onClick={() => {
                      setViewStudent(item);
                      setShowViewModal(true);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#777" }}>
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Confirmation Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm {modalAction === "approve" ? "Approval" : "Rejection"}</h3>
            <p>
              Are you sure you want to <strong>{modalAction}</strong> clearance for{" "}
              <strong>{selectedRequest.student}</strong>?
            </p>
            <div className="modal-buttons">
              <button
                className="btn-confirm"
                onClick={() => {
                  if (modalAction === "approve") {
                    handleApprove(selectedRequest.id);
                  } else {
                    handleReject(selectedRequest.id);
                  }
                  setShowModal(false);
                  setSelectedRequest(null);
                }}
              >
                Confirm
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👁️ View Details Modal */}
      {showViewModal && viewStudent && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Student Clearance Details</h3>
            <p><strong>Name:</strong> {viewStudent.student}</p>
            <p><strong>Type:</strong> {viewStudent.type}</p>
            <p><strong>Department:</strong> {viewStudent.dept}</p>
            <p><strong>Status:</strong> {viewStudent.status}</p>
            <p><strong>Date:</strong> {viewStudent.date}</p>

            <div className="modal-buttons">
              <button
                className="btn-confirm"
                onClick={() => {
                  window.location.href = `/students/${viewStudent.id}`;
                }}
              >
                Go to Student Page
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowViewModal(false);
                  setViewStudent(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Requests;
