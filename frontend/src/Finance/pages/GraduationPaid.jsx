// 📁 src/Finance/pages/GraduationPaid.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import FinanceSidebar from "../components/FinanceSidebar";
import SkeletonTable from "../../components/loaders/skeletonTable";

import "./GraduationPaid.css";

function GraduationPaid() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true); // 👈 Added loading state
   const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    axios.get("http://localhost:5000/api/finance/graduation-paid")
      .then((res) => setRecords(res.data))
      .catch((err) => console.error("Error fetching graduation-paid list", err))
      .finally(() => setLoading(false)); // ✅ Turn off loading

  }, []);
  const filteredRecords = records.filter((student) => {
  const term = searchTerm.toLowerCase();
  return (
    student.studentId?.toLowerCase().includes(term) ||
    student.fullName?.toLowerCase().includes(term)
  );
});


  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <h2>Graduation Fee Paid Students</h2>

<div className="filter-bar">
  <input
    type="text"
    placeholder="🔍 Search by Student ID or Name..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
        {loading ? (
          
  <SkeletonTable rows={5} cols={5} />
        ) : filteredRecords.length === 0 ? (
          <p>No records found.</p>
        ) : (
          <table className="graduation-paid-table">
            <thead>
              <tr>
                                  <th>No.</th>

                <th>Student ID</th>
                <th>Name</th>
                <th>Amount</th>
                <th>Receipt</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
                  {filteredRecords.map((student, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>

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