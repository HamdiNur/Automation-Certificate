// 📁 src/Finance/pages/GraduationPaid.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import FinanceSidebar from "../components/FinanceSidebar";
import "./GraduationPaid.css";

function GraduationPaid() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true); // 👈 Added loading state

  useEffect(() => {
    axios.get("http://localhost:5000/api/finance/graduation-paid")
      .then((res) => setRecords(res.data))
      .catch((err) => console.error("Error fetching graduation-paid list", err))
      .finally(() => setLoading(false)); // ✅ Turn off loading
  }, []);

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <h2>Graduation Fee Paid Students</h2>

        {loading ? (
          <p className="loading-text">⏳ Loading paid students...</p>
        ) : records.length === 0 ? (
          <p>No records found.</p>
        ) : (
          <table className="graduation-paid-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Amount</th>
                <th>Receipt</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((student, index) => (
                <tr key={index}>
                  <td>{student.studentId}</td>
                  <td>{student.fullName}</td>
                  <td>${student.amount}</td>
                  <td>{student.receipt}</td>
                  <td>{new Date(student.paidAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default GraduationPaid;
