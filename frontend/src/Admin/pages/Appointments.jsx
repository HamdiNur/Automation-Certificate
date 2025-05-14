import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const sampleAppointments = [
  { id: 1, student: "Amina Yusuf", date: "2025-06-01", status: "Scheduled" },
  { id: 2, student: "Mohamed Ali", date: "2025-06-02", status: "Scheduled" },
  { id: 3, student: "Fatima Ahmed", date: "2025-06-01", status: "Attended" },
  { id: 4, student: "Ahmed Ibrahim", date: "2025-06-03", status: "Missed" },
];

function Appointments() {
  const [appointments, setAppointments] = useState(sampleAppointments);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCheckIn = (id) => {
    const updated = appointments.map((a) =>
      a.id === id ? { ...a, status: "Attended" } : a
    );
    setAppointments(updated);
  };

  const filtered = appointments.filter((a) =>
    a.student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <h2>Certificate Appointments</h2>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>{a.student}</td>
                <td>{a.date}</td>
                <td>
                  <span className={`badge ${a.status.toLowerCase()}`}>
                    {a.status}
                  </span>
                </td>
                <td>
                  {a.status === "Scheduled" ? (
                    <button
                      className="btn-approve"
                      onClick={() => handleCheckIn(a.id)}
                    >
                      Mark as Checked In
                    </button>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#777" }}>
                  No appointments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Appointments;
