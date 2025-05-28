import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import "./Dashboard.css";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAppointments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/appointments");
      setAppointments(res.data);
    } catch (err) {
      console.error("❌ Failed to load appointments", err.message);
    }
  };

  const handleCheckIn = async (studentId) => {
    try {
      await axios.post("http://localhost:5000/api/appointments/check-in", {
        studentId,
      });
      alert("✅ Checked in!");
      fetchAppointments();
    } catch (err) {
      alert("❌ Failed to check in.");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filtered = appointments.filter((a) =>
    a.studentId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <h2>📅 Certificate Appointments</h2>

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
              <th>No.</th>
              <th>Student Name</th>
              <th>Student ID</th>
              <th>Appointment Date</th>
              <th>Status</th>
              <th>Checked In</th>
              <th>Checked In By</th> 
              <th>Rescheduled</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, index) => (
              <tr key={a._id}>
                <td>{index + 1}</td>
                <td>{a.studentId?.fullName}</td>
                <td>{a.studentId?.studentId}</td>
                <td>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                <td>{a.status}</td>
                <td>{a.checkedIn ? "✅" : "❌"}</td>
                  <td>{a.checkedInBy ? a.checkedInBy.fullName : "—"}</td> {/* ✅ New */}

                <td>{a.rescheduled ? "Yes" : "No"}</td>
                <td>
                  {a.status === "scheduled" && !a.checkedIn ? (
                    <button
                      className="btn-check"
                      onClick={() => handleCheckIn(a.studentId._id)}
                    >
                      ✅ Check-In
                    </button>
                  ) : (
                    <span style={{ color: "#999" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", color: "#777" }}>
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
