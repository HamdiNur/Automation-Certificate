import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import LabSidebar from "../components/LabSidebar";

function LabDashboard() {
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [returnedItemsInput, setReturnedItemsInput] = useState("");
  const [issuesInput, setIssuesInput] = useState("None");
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [loadingApproveId, setLoadingApproveId] = useState(null);

  const BASE_URL = "http://localhost:5000/api/lab";

  const fetchStats = async () => {
    try {
      const res = await axios.get(BASE_URL);
      const all = res.data;
      setStats({
        approved: all.filter((item) => item.status === "Approved").length,
        pending: all.filter((item) => item.status === "Pending").length,
        rejected: all.filter((item) => item.status === "Rejected").length,
      });
    } catch (err) {
      console.error("Error fetching lab stats", err);
    }
  };

  const fetchPending = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/pending`, {
        params: { search: search.trim() },
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

  const handleApproveWithItems = async () => {
  if (!returnedItemsInput.trim() || !issuesInput.trim()) {
    alert("Please fill both returned items and issues (or type 'None').");
    return;
  }

  if (loadingApproveId) return;
  setLoadingApproveId(currentGroupId);

  try {
    const approvedBy = localStorage.getItem("userId") || "System";

    await axios.post(`${BASE_URL}/approve`, {
      groupId: currentGroupId,
      approvedBy,
      returnedItems: returnedItemsInput.trim(),
      issues: issuesInput.trim(),
    });

    // ✅ Optimistically remove from UI
    setPending(prev => prev.filter(item => item.groupId._id !== currentGroupId));
    setStats(prev => ({
      ...prev,
      approved: prev.approved + 1,
      pending: prev.pending - 1
    }));

  } catch (err) {
    console.error("Approval failed:", err);
    alert("Approval failed. Please try again.");
  } finally {
    setLoadingApproveId(null);
    setShowApproveModal(false);
    setCurrentGroupId(null);
    setReturnedItemsInput("");
    setIssuesInput("None");
    setExpandedRow(null);
  }
};


  const handleReject = async (groupId) => {
    const issues = prompt("Enter reason for rejection:");
    if (!issues) return;

    try {
      await axios.post(`${BASE_URL}/reject`, { groupId, issues });
      await fetchStats();
      await fetchPending();
      setExpandedRow(null);
    } catch (err) {
      console.error("Rejection failed:", err);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h2>🔬 Lab Dashboard</h2>
          <div className="staff-info">
            <p><strong>Maryan Hussein</strong><br /><span>Lab Assistant</span></p>
          </div>
        </header>

        <section className="stats-boxes">
          <div className="stat-card pending"><h4>⏳ Pending</h4><p>{stats.pending}</p></div>
          <div className="stat-card rejected"><h4>❌ Rejected</h4><p>{stats.rejected}</p></div>
          <div className="stat-card approved"><h4>✅ Cleared</h4><p>{stats.approved}</p></div>
        </section>

        <div className="note-box">
          <p><strong>⚠ Reminder:</strong> Lab clearance requires return of all borrowed equipment.</p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search by group number or student ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPending()}
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
                <th>Returned Items</th>
                <th>Status</th>
                <th>Issues</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr><td colSpan="6">🎉 No pending lab records</td></tr>
              ) : (
                pending.map((rec) => (
                  <React.Fragment key={rec._id}>
                    <tr>
                      <td>{rec.groupId?.groupNumber || "-"}</td>
                      <td>{rec.members.map(m => (<div key={m._id} className="member-name">{m.fullName}</div>))}</td>
                      <td>{rec.returnedItems?.trim() ? rec.returnedItems : <span className="badge badge-danger">❌ Not Returned</span>}</td>
                      <td><span className={`badge ${rec.status === "Approved" ? "badge-success" : rec.status === "Rejected" ? "badge-danger" : "badge-pending"}`}>{rec.status}</span></td>
                      <td>{rec.issues || "—"}</td>
                      <td><button className="btn-view" onClick={() => setExpandedRow(expandedRow === rec._id ? null : rec._id)}>👁 View</button></td>
                    </tr>
                    {expandedRow === rec._id && (
                      <tr>
                        <td colSpan="6">
                          <div style={{ backgroundColor: "#f9f9f9", padding: 15, borderRadius: 8 }}>
                            <p><strong>📋 Members:</strong></p>
                            <ul>{rec.members.map(m => (<li key={m._id}>{m.fullName} ({m.studentId})</li>))}</ul>
                            <p><strong>Returned Items:</strong> {rec.returnedItems || "❌ None returned"}</p>
                            <p><strong>Issues:</strong> {rec.issues || "—"}</p>
                            <div style={{ marginTop: 10 }}>
                              <button className="btn-approve" onClick={() => {
                                setCurrentGroupId(rec.groupId._id);
                                setReturnedItemsInput("");
                                setIssuesInput("None");
                                setShowApproveModal(true);
                              }} disabled={loadingApproveId === rec.groupId._id || !!rec.returnedItems?.trim()}>
                                {loadingApproveId === rec.groupId._id ? "Approving..." : "✅ Approve"}
                              </button>
                              <button className="btn-reject" onClick={() => handleReject(rec.groupId._id)} style={{ marginLeft: 10 }} disabled={!rec.issues?.trim()}>❌ Reject</button>
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
        </div>
      </div>

      {showApproveModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Enter Returned Items & Issues</h3>
            <textarea rows="3" style={{ width: "100%", marginBottom: 10 }} value={returnedItemsInput} onChange={(e) => setReturnedItemsInput(e.target.value)} placeholder="List returned items here..." />
            <textarea rows="3" style={{ width: "100%" }} value={issuesInput} onChange={(e) => setIssuesInput(e.target.value)} placeholder="List issues here (or type 'None')" />
            <div style={{ marginTop: 10, textAlign: "right" }}>
              <button onClick={() => setShowApproveModal(false)} style={{ marginRight: 10 }}>Cancel</button>
              <button onClick={handleApproveWithItems} disabled={loadingApproveId !== null}>{loadingApproveId !== null ? "Approving..." : "Approve"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalContentStyle = {
  backgroundColor: "#fff",
  padding: 20,
  borderRadius: 8,
  width: 400,
  maxWidth: "90%",
};

export default LabDashboard;
