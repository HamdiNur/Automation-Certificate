import React, { useState } from "react";
import axios from "axios";
import FinanceSidebar from "../components/FinanceSidebar";
import "./FinancePayments.css";

function FinancePayments() {
  const [studentIdInput, setStudentIdInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    try {
const res = await axios.get(`http://localhost:5000/api/finance/finance-summary/${studentIdInput}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Student not found");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <h2>Search Student Finance Record</h2>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Enter Student ID (e.g., NU230001)"
            value={studentIdInput}
            onChange={(e) => setStudentIdInput(e.target.value)}
            required
          />
          <button type="submit">Search</button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {result && (
          <div className="finance-summary">
            <h3>{result.student.fullName} ({result.student.studentId})</h3>
            <ul>
              <li>Total Charges: ${result.summary.totalCharges}</li>
              <li>Total Paid: ${result.summary.totalPaid}</li>
              <li>Balance: ${result.summary.balance}</li>
              <li>Can Graduate: {result.summary.canGraduate ? "✅ Yes" : "❌ No"}</li>
            </ul>

            <table>
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Receipt</th>
                  <th>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {result.transactions.map((t, i) => (
                  <tr key={i}>
                    <td>{t.semester}</td>
                    <td>{t.date}</td>
                    <td>{t.type}</td>
                    <td>{t.description}</td>
                    <td>{t.amount}</td>
                    <td>{t.paymentMethod}</td>
                    <td>{t.receiptNumber}</td>
                    <td>{t.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancePayments;
