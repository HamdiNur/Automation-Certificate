import React, { useState } from "react";
import FinanceSidebar from "../components/FinanceSidebar";

const samplePayments = [
  { id: 1, student: "Amina Yusuf", amount: 300, status: "Paid" },
  { id: 2, student: "Mohamed Ali", amount: 300, status: "Unpaid" },
  { id: 3, student: "Fatima Ahmed", amount: 300, status: "Paid" },
  { id: 4, student: "Ahmed Ibrahim", amount: 300, status: "Unpaid" },
];

function FinancePayments() {
  const [payments, setPayments] = useState(samplePayments);

  const togglePaymentStatus = (id) => {
    const updated = payments.map((p) =>
      p.id === id
        ? {
            ...p,
            status: p.status === "Paid" ? "Unpaid" : "Paid",
          }
        : p
    );
    setPayments(updated);
  };

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <h2>Student Payments</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.student}</td>
                <td>${p.amount}</td>
                <td>
                  <span className={`badge ${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <button
                    className={p.status === "Paid" ? "btn-reject" : "btn-approve"}
                    onClick={() => togglePaymentStatus(p.id)}
                  >
                    Mark as {p.status === "Paid" ? "Unpaid" : "Paid"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FinancePayments;
