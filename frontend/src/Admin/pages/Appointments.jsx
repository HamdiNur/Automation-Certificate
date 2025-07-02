import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import "./Dashboard.css";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showReschedule, setShowReschedule] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");

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
    const token = localStorage.getItem("token"); // or sessionStorage, based on your app
    await axios.post(
      "http://localhost:5000/api/appointments/check-in",
      { studentId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    alert("✅ Checked in!");
    fetchAppointments();
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to check in.";
    alert("❌ " + msg);
  }
};

  const handleReschedule = async () => {
    if (!newDate || !reason) return alert("Please provide both date and reason.");

    try {
      await axios.post("http://localhost:5000/api/appointments/reschedule", {
        studentId: selected.studentId._id,
        newDate,
        reason,
      });
      alert("✅ Appointment rescheduled!");
      setShowReschedule(false);
      setSelected(null);
      setNewDate("");
      setReason("");
      fetchAppointments();
    }  catch (err) {
  const msg = err.response?.data?.message || "Failed to reschedule.";
  alert("❌ " + msg);
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
                <td>{a.checkedIn ? "Yes" : "No"}</td>
                <td>{a.checkedInBy ? a.checkedInBy.fullName : "—"}</td>
                <td>{a.rescheduled ? "Yes" : "No"}</td>
                <td>
                 {["scheduled", "rescheduled"].includes(a.status) && !a.checkedIn ? (
  <>
    <button
      className="btn-check"
      onClick={() => handleCheckIn(a.studentId._id)}
    >
      ✅ Check-In
    </button>
    <button
      className="btn-reschedule"
      onClick={() => {
        setSelected(a);
        setShowReschedule(true);
      }}
    >
      🗓️ Reschedule
    </button>
  </>
) : (
  <span style={{ color: "#999" }}>—</span>
)}

                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", color: "#777" }}>
                  No appointments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 🔁 Reschedule Modal */}
        {showReschedule && selected && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Reschedule Appointment</h3>
              <p><strong>Student:</strong> {selected.studentId?.fullName}</p>

              <label>New Date:</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />

              <label>Reason:</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for rescheduling..."
                rows={3}
              />

             <div className="modal-buttons">
  <button className="btn-confirm" onClick={handleReschedule}>
    Confirm
  </button>
  <button className="btn-cancel" onClick={() => {
    setShowReschedule(false);
    setSelected(null);
    setNewDate("");
    setReason("");
  }}>
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

export default Appointments;
