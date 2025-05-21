import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import LabSidebar from "../components/LabSidebar"; // Lab sidebar

function LabDashboard() {
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  // Modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [returnedItemsInput, setReturnedItemsInput] = useState("");
  const [issuesInput, setIssuesInput] = useState("None"); // default None
  const [currentGroupId, setCurrentGroupId] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lab");
      const all = res.data;
      const approved = all.filter((item) => item.status === "Approved").length;
      const pendingCount = all.filter((item) => item.status === "Pending").length;
      const rejected = all.filter((item) => item.status === "Rejected").length;
      setStats({ approved, pending: pendingCount, rejected });
    } catch (err) {
      console.error("Error fetching lab stats", err);
    }
  };

  const fetchPending = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lab/pending", {
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

  // Approve with modal inputs
  const handleApproveWithItems = async () => {
    if (!returnedItemsInput.trim()) {
      alert("Please enter returned items before approving.");
      return;
    }
    if (!issuesInput.trim()) {
      alert("Please enter issues or type 'None'.");
      return;
    }

    try {
      const approvedBy = localStorage.getItem("userId") || "System";
      await axios.post("http://localhost:5000/api/lab/approve", {
        groupId: currentGroupId,
        approvedBy,
        returnedItems: returnedItemsInput.trim(),
        issues: issuesInput.trim(),
      });
      setShowApproveModal(false);
      setCurrentGroupId(null);
      setReturnedItemsInput("");
      setIssuesInput("None");
      await fetchStats();
      await fetchPending();
      setExpandedRow(null);
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const handleReject = async (groupId) => {
    const issues = prompt("Enter reason for rejection:");
    if (!issues) return;
    try {
      await axios.post("http://localhost:5000/api/lab/reject", { groupId, issues });
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
            <p>
              <strong>Maryan Hussein</strong>
              <br />
              <span>Lab Assistant</span>
            </p>
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
          <p>
            <strong>⚠ Reminder:</strong> Lab clearance requires return of all borrowed equipment.
          </p>
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
                <tr>
                  <td colSpan="6">🎉 No pending lab records</td>
                </tr>
              ) : (
                pending.map((rec) => (
                  <React.Fragment key={rec._id}>
                    <tr>
                      <td>{rec.groupId?.groupNumber || "-"}</td>
                      <td>
                        {rec.members.map((m) => (
                          <div key={m._id} className="member-name">
                            {m.fullName}
                          </div>
                        ))}
                      </td>
                      <td>
                        {rec.returnedItems?.trim() ? (
                          rec.returnedItems
                        ) : (
                          <span className="badge badge-danger">❌ Not Returned</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            rec.status === "Approved"
                              ? "badge-success"
                              : rec.status === "Rejected"
                              ? "badge-danger"
                              : "badge-pending"
                          }`}
                        >
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
                          <div
                            style={{
                              backgroundColor: "#f9f9f9",
                              padding: "15px",
                              borderRadius: "8px",
                            }}
                          >
                            <p>
                              <strong>📋 Members:</strong>
                            </p>
                            <ul>
                              {rec.members.map((m) => (
                                <li key={m._id}>
                                  {m.fullName} ({m.studentId})
                                </li>
                              ))}
                            </ul>

                            <p>
                              <strong>Returned Items:</strong> {rec.returnedItems || "❌ None returned"}
                            </p>
                            <p>
                              <strong>Issues:</strong> {rec.issues || "—"}
                            </p>

                            <div style={{ marginTop: "10px" }}>
                              <button
                                className="btn-approve"
                                onClick={() => {
                                  setCurrentGroupId(rec.groupId._id);
                                  setReturnedItemsInput("");
                                  setIssuesInput("None");
                                  setShowApproveModal(true);
                                }}
                                // Disabled if already returned items filled to force edit in modal
                                disabled={!!rec.returnedItems?.trim()}
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
        </div>
      </div>

      {/* Modal for entering returned items and issues */}
      {showApproveModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Enter Returned Items & Issues</h3>
            <textarea
              rows="3"
              style={{ width: "100%", marginBottom: 10 }}
              value={returnedItemsInput}
              onChange={(e) => setReturnedItemsInput(e.target.value)}
              placeholder="List returned items here..."
            />
            <textarea
              rows="3"
              style={{ width: "100%" }}
              value={issuesInput}
              onChange={(e) => setIssuesInput(e.target.value)}
              placeholder="List issues here (or type 'None')"
            />
            <div style={{ marginTop: 10, textAlign: "right" }}>
              <button
                onClick={() => setShowApproveModal(false)}
                style={{ marginRight: 10 }}
              >
                Cancel
              </button>
              <button onClick={handleApproveWithItems}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal styles
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
