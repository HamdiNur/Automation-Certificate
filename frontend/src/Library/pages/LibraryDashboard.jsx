<<<<<<< HEAD
import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";
=======
import React from "react";
>>>>>>> master
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

function LibraryDashboard() {
<<<<<<< HEAD
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/library");
      const all = res.data;
      const approved = all.filter(item => item.status === "Approved").length;
      const pending = all.filter(item => item.status === "Pending").length;
      const rejected = all.filter(item => item.status === "Rejected").length;
      setStats({ approved, pending, rejected });
    } catch (err) {
      console.error("Error fetching stats", err);
    }
  };

  const fetchPending = useCallback(async () => {
    try {
      const res = await axios.get("/library/pending", {
        params: { search: search.trim() }
      });
      setPending(res.data);
    } catch (err) {
      console.error("Error fetching pending records", err);
    }
  }, [search]);

  useEffect(() => {
    fetchStats();
    fetchPending();
  }, [fetchPending]);

 const handleApprove = async (groupId) => {
  try {
    const staffId = localStorage.getItem("userId"); // ✅ or hardcoded

    await axios.post("/library/approve", {
      groupId,
      libraryStaffId: staffId
    });

    fetchPending();
    setExpandedRow(null);
  } catch (err) {
    console.error("Approval failed:", err.response?.data || err.message);
  }
};


  const handleReject = async (groupId) => {
    const remarks = prompt("Enter reason for rejection:");
    if (!remarks) return;

    try {
      await axios.post("/library/reject", {
        groupId,
        remarks
      });
      fetchPending();
      setExpandedRow(null);
    } catch (err) {
      console.error("Rejection failed:", err);
    }
  };

=======
>>>>>>> master
  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
<<<<<<< HEAD
        <header className="dashboard-header">
          <h2>📚 Library Dashboard</h2>
          <div className="staff-info">
            <p><strong>George Brown</strong><br /><span>Library Staff</span></p>
          </div>
        </header>

        <section className="stats-boxes">
          <div className="stat-card pending">
            <h4>⏳ Pending</h4>
            <p>{stats.pending}</p>
          </div>
          <div className="stat-card rejected">
            <h4>❌ Rejected</h4>
            <p>{stats.rejected}</p>
          </div>
          <div className="stat-card approved">
            <h4>✅ Cleared</h4>
            <p>{stats.approved}</p>
          </div>
        </section>

        <div className="note-box">
          <p><strong>⚠ Reminder:</strong> A group can only be cleared after Faculty approval and thesis return.</p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search by group number or student ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchPending()}
          />
          <button onClick={fetchPending}>Search</button>
        </div>

        <div className="pending-table">
          <h3>📝 Pending Group Thesis Returns</h3>
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Members</th>
                <th>Faculty cleared</th>
                <th>Thesis Received</th>
                <th>Status</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr><td colSpan="7">🎉 No pending records found</td></tr>
              ) : (
                pending.map(rec => (
                  <React.Fragment key={rec._id}>
                    <tr>
                      <td>{rec.groupId?.groupNumber || "-"}</td>
                      <td>
                        {rec.members.map(m => (
                          <div key={m._id} className="member-name">{m.fullName}</div>
                        ))}
                      </td>
                      <td>
                        <span className={`badge ${rec.facultyCleared ? 'badge-success' : 'badge-danger'}`}>
                          {rec.facultyCleared ? "Cleared" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${rec.thesisBookReceived ? 'badge-success' : 'badge-danger'}`}>
                          {rec.thesisBookReceived ? "Received" : "Missing"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          rec.status === "Approved" ? "badge-success" :
                          rec.status === "Rejected" ? "badge-danger" : "badge-pending"
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td>{rec.remarks || "—"}</td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() =>
                            setExpandedRow(expandedRow === rec._id ? null : rec._id)
                          }
                        >
                          👁 View
                        </button>
                      </td>
                    </tr>

                    {expandedRow === rec._id && (
                      <tr>
                        <td colSpan="7">
                          <div style={{
                            backgroundColor: "#f9f9f9",
                            padding: "15px",
                            borderRadius: "8px"
                          }}>
                            <p><strong>📘 Members:</strong></p>
                            <ul>
                              {rec.members.map(m => (
                                <li key={m._id}>{m.fullName} ({m.studentId})</li>
                              ))}
                            </ul>

                            <div style={{ marginTop: "10px" }}>
                              <button
                                className="btn-approve"
                                onClick={() => handleApprove(rec.groupId._id)}
                              >
                                ✅ Approve
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => handleReject(rec.groupId._id)}
                                style={{ marginLeft: "10px" }}
                              >
                                ❌ Reject
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
=======
        <h2>Library Dashboard</h2>
        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>Books Received</h3>
            <p>28</p>
          </div>
          <div className="widget-card">
            <h3>Pending Submissions</h3>
            <p>4</p>
          </div>
>>>>>>> master
        </div>
      </div>
    </div>
  );
}

export default LibraryDashboard;
