import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState({
    pending: 0,
    nameCorrections: 0,
    approved: 0,
  });

  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchPending();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/examination/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/examination/pending");
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching examination records", err);
    }
  };

  const handleApprove = async (studentId) => {
    const approvedBy = localStorage.getItem("userMongoId"); // ✅ use actual MongoDB _id
    if (!approvedBy) {
      alert("Approver ID not found in local storage.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/examination/approved", {
        studentId,
        approvedBy,
      });
      fetchStats();
      fetchPending();
    } catch (err) {
      alert("Approval failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (studentId) => {
    try {
      await axios.post("http://localhost:5000/api/examination/reject", {
        studentId,
        remarks: "Incomplete clearance requirements",
      });
      fetchStats();
      fetchPending();
    } catch (err) {
      alert("Rejection failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        {/* Stat Cards */}
        <div className="cards">
          <div className="card blue">
            <div>
              <div>{stats.pending}</div>
              <span>Pending Requests</span>
            </div>
          </div>
          <div className="card yellow">
            <div>
              <div>{stats.nameCorrections}</div>
              <span>Name Correction Requests</span>
            </div>
          </div>
          <div className="card green">
            <div>
              <div>{stats.approved}</div>
              <span>Approved Clearances</span>
            </div>
          </div>
        </div>

        {/* Pending Table */}
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Student Name</th>
              <th>ID</th>
              <th>Program</th>
              <th>Passed?</th>
              <th>Can Graduate?</th>
              <th>Name Correction?</th>
              <th>Docs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((item, index) => {
              const s = item.studentId || {};
              const docsOk = item.requiredDocs?.passportUploaded && s.nameVerified;
              const status = item.clearanceStatus;

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{s.fullName}</td>
                  <td>{s.studentId}</td>
                  <td>{s.program}</td>
                  <td>{item.hasPassedAllCourses ? "✅" : "❌"}</td>
                  <td>{item.canGraduate ? "✅" : "❌"}</td>
                  <td>{item.nameCorrectionDoc ? "✅" : "❌"}</td>
                  <td>
                    {docsOk ? (
                      <span className="badge badge-success">✅ Verified</span>
                    ) : (
                      <span className="badge badge-danger">❌ Incomplete</span>
                    )}
                  </td>
                  <td>
                    {!item.hasPassedAllCourses ? (
                      <span className="badge badge-danger">Re-exam Required</span>
                    ) : (
                      <span className={`badge ${status.toLowerCase()}`}>{status}</span>
                    )}
                  </td>
                  <td>
                    {status === "Pending" ? (
                      <>
                        <button className="btn-approve" onClick={() => handleApprove(s._id)}>
                          Approve
                        </button>
                        <button className="btn-reject" onClick={() => handleReject(s._id)}>
                          Reject
                        </button>
                      </>
                    ) : (
                      <button className="btn-view">View Certificate</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
