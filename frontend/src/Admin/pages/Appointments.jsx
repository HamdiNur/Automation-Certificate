"use client"

import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from "socket.io-client";

import {
  useGetAppointmentsQuery,
  useCheckInAppointmentMutation,
  useRescheduleAppointmentMutation,
} from "../../redux/api/appointmentApiSlice";

import "./Dashboard.css";

function Appointments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [socket, setSocket] = useState(null);

  const {
    data: appointments = [],
    isLoading,
    refetch,
  } = useGetAppointmentsQuery();

  const [checkInAppointment] = useCheckInAppointmentMutation();
  const [rescheduleAppointment] = useRescheduleAppointmentMutation();

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("appointmentUpdated", (data) => {
      toast.info(`🔄 Appointment updated for ${data.fullName}`);
      refetch();
    });

    return () => newSocket.disconnect();
  }, [refetch]);

  const handleCheckIn = async (studentId) => {
    try {
      await checkInAppointment(studentId).unwrap();
      toast.success("✅ Checked in successfully");
    } catch (err) {
      toast.error("❌ Failed to check in");
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !reason) return toast.error("Please provide both date and reason");
    try {
      await rescheduleAppointment({
        studentId: selected.studentId._id,
        newDate,
        reason,
      }).unwrap();
      toast.success("✅ Appointment rescheduled");
      setShowReschedule(false);
      setSelected(null);
      setNewDate("");
      setReason("");
    } catch (err) {
      toast.error("❌ Failed to reschedule appointment");
    }
  };

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
                      <button className="btn-check" onClick={() => handleCheckIn(a.studentId._id)}>
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
                <button className="btn-confirm" onClick={handleReschedule}>Confirm</button>
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowReschedule(false);
                    setSelected(null);
                    setNewDate("");
                    setReason("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}

export default Appointments;
