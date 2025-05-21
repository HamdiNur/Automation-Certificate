// 📁 src/Finance/pages/PendingApprovals.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import FinanceSidebar from "../components/FinanceSidebar";
import "./PendingApprovals.css";

function PendingApprovals() {
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ Loading state

  useEffect(() => {
    axios.get("http://localhost:5000/api/finance/pending")
      .then(res => setPendingRecords(res.data))
      .catch(err => console.error("Error loading pending records", err))
      .finally(() => setLoading(false)); // ✅ Stop loading
  }, []);

  const handleApprove = async (studentId) => {
    try {
      await axios.post("http://localhost:5000/api/finance/approve", {
        studentId,
        approvedBy: "admin"
      });
      setPendingRecords(pendingRecords.filter(r => r.studentId !== studentId));
    } catch (err) {
      alert("Approve failed.");
    }
  };

  const handleReject = async (studentId) => {
    try {
      await axios.post("http://localhost:5000/api/finance/reject", {
        studentId,
        remarks: "Rejected by admin"
      });
      setPendingRecords(pendingRecords.filter(r => r.studentId !== studentId));
    } catch (err) {
      alert("Reject failed.");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <h2>Pending Finance Approvals</h2>

        {loading ? (
          <p className="loading-text">⏳ Loading pending records...</p>
        ) : pendingRecords.length === 0 ? (
          <p>No pending records found.</p>
        ) : (
          <table className="pending-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRecords.map((record, index) => (
                <tr key={index}>
                  <td>{record.studentId}</td>
                  <td>{record.fullName}</td>
                  <td>{record.description}</td>
                  <td>${record.amount}</td>
                  <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                  <td>{record.type}</td>
                  <td>
                    <button className="approve-btn" onClick={() => handleApprove(record.studentId)}>Approve</button>
                    <button className="reject-btn" onClick={() => handleReject(record.studentId)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PendingApprovals;
