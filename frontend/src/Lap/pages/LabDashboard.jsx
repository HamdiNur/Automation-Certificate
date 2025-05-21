<<<<<<< HEAD
import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";
import LabSidebar from "../components/LabSidebar"; // ✅ Lab sidebar

function LabDashboard() {
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/lab");
      const all = res.data;
      const approved = all.filter(item => item.status === "Approved").length;
      const pending = all.filter(item => item.status === "Pending").length;
      const rejected = all.filter(item => item.status === "Rejected").length;
      setStats({ approved, pending, rejected });
    } catch (err) {
      console.error("Error fetching lab stats", err);
    }
  };

  const fetchPending = useCallback(async () => {
    try {
      const res = await axios.get("/lab/pending", {
        params: { search: search.trim() }
      });
      setPending(res.data);
    } catch (err) {
      console.error("Error fetching pending lab records", err);
    }
  }, [search]);

  useEffect(() => {
    fetchStats();
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (groupId) => {
    try {
      const approvedBy = localStorage.getItem("userId");
      await axios.post("/lab/approve", {
        groupId,
        approvedBy
      });
      fetchPending();
      setExpandedRow(null);
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const handleReject = async (groupId) => {
    const issues = prompt("Enter reason for rejection:");
    if (!issues) return;
    try {
      await axios.post("/lab/reject", {
        groupId,
        issues
      });
      fetchPending();
      setExpandedRow(null);
    } catch (err) {
      console.error("Rejection failed:", err);
    }
  };

=======
import React from "react";
import LabSidebar from "../components/LabSidebar";
import "./style/style.css"
function LabDashboard() {
>>>>>>> master
  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
<<<<<<< HEAD
        <header className="dashboard-header">
          <h2>🔬 Lab Dashboard</h2>
          <div className="staff-info">
            <p><strong>Maryan Hussein</strong><br /><span>Lab Assistant</span></p>
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
          <p><strong>⚠ Reminder:</strong> Lab clearance requires return of all borrowed equipment.</p>
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
          <h3>📝 Pending Lab Clearances</h3>
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Members</th>
                <th>Returned Items</th> {/* ✅ Added column */}
                <th>Status</th>
                <th>Issues</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr><td colSpan="6">🎉 No pending lab records</td></tr>
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
                        {rec.returnedItems?.trim()
                          ? rec.returnedItems
                          : <span className="badge badge-danger">❌ Not Returned</span>}
                      </td>
                      <td>
                        <span className={`badge ${
                          rec.status === "Approved" ? "badge-success" :
                          rec.status === "Rejected" ? "badge-danger" : "badge-pending"
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td>{rec.issues || "—"}</td>
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
                        <td colSpan="6">
                          <div style={{
                            backgroundColor: "#f9f9f9",
                            padding: "15px",
                            borderRadius: "8px"
                          }}>
                            <p><strong>📋 Members:</strong></p>
                            <ul>
                              {rec.members.map(m => (
                                <li key={m._id}>{m.fullName} ({m.studentId})</li>
                              ))}
                            </ul>

                            <p><strong>Returned Items:</strong> {rec.returnedItems || "❌ None returned"}</p>
                            <p><strong>Issues:</strong> {rec.issues || "—"}</p>

                            <div style={{ marginTop: "10px" }}>
                              <button
                                className="btn-approve"
                                onClick={() => handleApprove(rec.groupId._id)}
                                disabled={!rec.returnedItems?.trim()}
                              >
                                ✅ Approve
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => handleReject(rec.groupId._id)}
                                style={{ marginLeft: "10px" }}
                                disabled={!rec.issues?.trim()}
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
        <h2>Lab Dashboard</h2>
        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>Returned Equipment</h3>
            <p>20</p>
          </div>
          <div className="widget-card">
            <h3>Not Returned</h3>
            <p>5</p>
          </div>
>>>>>>> master
        </div>
      </div>
    </div>
  );
}

export default LabDashboard;
