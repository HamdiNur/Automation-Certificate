import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SkeletonTable from "../../components/loaders/skeletonTable"; // adjust path if needed

import LabSidebar from "../components/LabSidebar";

function LabDashboard() {
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [returnedItemsInput, setReturnedItemsInput] = useState([]);
  const [issuesInput, setIssuesInput] = useState("None");
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [loadingApproveId, setLoadingApproveId] = useState(null);
  const [loading, setLoading] = useState(true);


  const BASE_URL = "http://localhost:5000/api/lab";

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching lab stats", err);
    }
  };
const fetchPending = useCallback(async () => {
  setLoading(true); // ✅ Start loading
  try {
    const res = await axios.get(`${BASE_URL}/pending`);
    setPending(res.data);
  } catch (err) {
    console.error("Error fetching pending lab records", err);
  } finally {
    setLoading(false); // ✅ End loading
  }
}, []);



  useEffect(() => {
    fetchStats();
    fetchPending();
  }, [fetchPending]);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("📡 Lab Socket connected:", socket.id);
    });

    socket.on("lab:new-eligible", () => {
      fetchStats();
      fetchPending();
      toast.info("🔬 New group ready for Lab clearance!");
    });

    return () => socket.disconnect();
  }, [fetchPending]);

  const handleApproveWithItems = async (manualGroupId = null) => {
    const groupId = manualGroupId || currentGroupId;
    const currentRecord = pending.find((p) => p.groupId._id === groupId);
    const expectedItems = currentRecord?.expectedItems || [];

    const allReturned =
      expectedItems.length === 0 ||
      expectedItems.every((item) =>
        returnedItemsInput.map((i) => i.toLowerCase()).includes(item.toLowerCase())
      );

    if (loadingApproveId) return;
    setLoadingApproveId(groupId);

    try {
      const approvedBy = localStorage.getItem("userId") || "System";
      const payload = {
        groupId,
        approvedBy,
        returnedItems: returnedItemsInput,
        issues: allReturned
          ? "None"
          : `Missing: ${expectedItems.filter(
              (i) => !returnedItemsInput.includes(i)
            ).join(", ")}`,
      };

const token = localStorage.getItem("token");
await axios.post(`${BASE_URL}/approve`, payload, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});      setShowApproveModal(false);
      await fetchStats();
      await fetchPending();
      toast.success(allReturned ? "✅ Approved" : "⚠ Marked Incomplete");
    } catch (err) {
      console.error("Approval failed:", err);
      toast.error("Approval failed.");
    } finally {
      setLoadingApproveId(null);
      setShowApproveModal(false);
      setCurrentGroupId(null);
      setReturnedItemsInput([]);
      setIssuesInput("None");
      setExpandedRow(null);
    }
  };

 const handleReject = async (groupId) => {
  const issues = prompt("Enter reason for rejection:");
  if (!issues) return;

  try {
    const token = localStorage.getItem("token"); // ✅ fetch stored token
    await axios.post(
      `${BASE_URL}/reject`,
      { groupId, issues },
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ attach token
        },
      }
    );
    await fetchStats();
    await fetchPending();
    setExpandedRow(null);
    toast.info("❌ Rejected successfully");
  } catch (err) {
    console.error("Rejection failed:", err.response?.data || err.message);
    toast.error("Rejection failed");
  }
};

const normalized = search.toLowerCase().replace(/\s+/g, "");
const filtered = pending.filter((rec) => {

  const groupNumber = String(rec.groupId?.groupNumber || "").trim().toLowerCase();
  const fullGroup = `group${groupNumber}`.replace(/\s+/g, "");
  const title = (rec.groupId?.projectTitle || "").toLowerCase();

  const matchExact = normalized === groupNumber;
  const matchFull = normalized === fullGroup;
  const includes = fullGroup.includes(normalized) || groupNumber.includes(normalized);
  const matchTitle = title.includes(normalized);

  const matchStudent = rec.members.some((m) =>
    `${m.fullName} ${m.studentId}`.toLowerCase().replace(/\s+/g, "").includes(normalized)
  );

  return matchExact || matchFull || includes || matchTitle || matchStudent;
});

const canReject = (rec) => {
  const hasExpected = (rec.expectedItems?.length || 0) > 0;

  let returned = [];

  if (Array.isArray(rec.returnedItems)) {
    returned = rec.returnedItems.map(i => i.trim()).filter(Boolean);
  } else if (typeof rec.returnedItems === "string") {
    returned = rec.returnedItems.split(",").map(i => i.trim()).filter(Boolean);
  }

  return hasExpected && returned.length === 0;
};

  return (
    <div className="dashboard-wrapper">
      <ToastContainer />
      <LabSidebar />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h2>🔬 Lab Dashboard</h2>
        </header>

        <section className="stats-boxes">
          <div className="stat-card pending"><h4>⏳ Pending</h4><p>{stats.pending}</p></div>
          <div className="stat-card rejected"><h4>❌ Rejected</h4><p>{stats.rejected}</p></div>
          <div className="stat-card approved"><h4>✅ Cleared</h4><p>{stats.approved}</p></div>
        </section>

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
                <th>Project Title</th>
                <th>Returned Items</th>
                <th>Status</th>
                <th>Issues</th>
                <th>Actions</th>
              </tr>
            </thead>
                   <tbody>
  {loading ? (
    <tr>
      <td colSpan="6">
        <SkeletonTable rows={4} />
      </td>
    </tr>
  ) : pending.length === 0 ? (
    <tr>
      <td colSpan="6">🎉 No pending records found</td>
    </tr>
  ) : (
          
filtered.map((rec) => (
                  <React.Fragment key={rec._id}>
                    <tr>
                      <td>{rec.groupId?.groupNumber ? `Group ${rec.groupId.groupNumber}` : "-"}</td>
                      <td>{rec.groupId?.projectTitle || "—"}</td>
<td>
  {(rec.expectedItems?.length || 0) === 0 ? (
    <span className="badge badge-info">Not Required</span>
  ) : (() => {
    let returned = Array.isArray(rec.returnedItems)
      ? rec.returnedItems.map(i => i.trim().toLowerCase()).filter(i => i !== "")
      : (rec.returnedItems || '')
          .split(',')
          .map(i => i.trim().toLowerCase())
          .filter(i => i !== "");

    if (returned.length === 0) {
      return <span className="badge not-returned">Not Returned</span>;
    }

return <span className="badge returned">{returned.filter(i => i).join(', ')}</span>;
  })()}
</td>


                      <td>
                        <span className={`badge ${
                          rec.status === "Approved"
                            ? "badge-success"
                            : rec.status === "Rejected"
                            ? "badge-danger"
                            : rec.status === "Incomplete"
                            ? "badge-warning"
                            : "badge-pending"
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td>{rec.issues || "—"}</td>
                      <td>
                        <button className="btn-view" onClick={() => setExpandedRow(expandedRow === rec._id ? null : rec._id)}>👁 View</button>
                      </td>
                    </tr>
                    {expandedRow === rec._id && (
                      <tr>
                        <td colSpan="6">
                          <div style={{ backgroundColor: "#f9f9f9", padding: 15, borderRadius: 8 }}>
                            <p><strong>📋 Members:</strong></p>
                            <ul>{rec.members.map(m => (<li key={m._id}>{m.fullName} ({m.studentId})</li>))}</ul>
                            <p><strong>Expected Items:</strong> {rec.expectedItems?.join(', ') || "—"}</p>
                            <p><strong>Returned Items:</strong> {Array.isArray(rec.returnedItems) ? rec.returnedItems.join(', ') : rec.returnedItems || "❌ None returned"}</p>
                            <p><strong>Issues:</strong> {rec.issues || "—"}</p>
                            <div style={{ marginTop: 10 }}>
                              <button
                                className="btn-approve"
                                onClick={() => {
                                  if ((rec.expectedItems || []).length === 0) {
                                    handleApproveWithItems(rec.groupId._id);
                                  } else {
                                    setCurrentGroupId(rec.groupId._id);
                                    setReturnedItemsInput(rec.returnedItems || []);
                                    setIssuesInput("None");
                                    setShowApproveModal(true);
                                  }
                                }}
                                disabled={loadingApproveId === rec.groupId._id || ["Approved", "Rejected"].includes(rec.status)}
                              >
                                {loadingApproveId === rec.groupId._id ? "Approving..." : "✅ Approve"}
                              </button>
<button
  className="btn-reject"
  onClick={() => handleReject(rec.groupId._id)}
  style={{ marginLeft: 10 }}
  disabled={!canReject(rec)}
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

      {showApproveModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>✅ Select Returned Items</h3>
            {(pending.find(p => p.groupId._id === currentGroupId)?.expectedItems || []).map((item, index) => (
              <label key={index} style={{ display: "block", marginBottom: 5 }}>
                <input
                  type="checkbox"
                  checked={returnedItemsInput.map(i => i.toLowerCase()).includes(item.toLowerCase())}
                  onChange={(e) => {
                    const updated = new Set(returnedItemsInput.map(i => i.toLowerCase()));
                    if (e.target.checked) {
                      updated.add(item.toLowerCase());
                    } else {
                      updated.delete(item.toLowerCase());
                    }
                    const updatedArray = Array.from(updated);
                    setReturnedItemsInput(updatedArray);
                    const expected = (pending.find(p => p.groupId._id === currentGroupId)?.expectedItems || []).map(i => i.toLowerCase());
                    const allReturned = expected.every(i => updatedArray.includes(i));
                    setIssuesInput(allReturned ? "None" : "Missing Items");
                  }}
                />{" "}
                {item}
              </label>
            ))}
            <textarea
              rows="3"
              style={{ width: "100%", marginTop: 10 }}
              value={issuesInput}
              onChange={(e) => setIssuesInput(e.target.value)}
              placeholder="Write any issues or type 'None'"
            />
            <div style={{ marginTop: 10, textAlign: "right" }}>
              <button onClick={() => setShowApproveModal(false)} style={{ marginRight: 10 }}>Cancel</button>
              <button
                onClick={() => handleApproveWithItems()}
                disabled={loadingApproveId !== null}
                style={{
                  backgroundColor:
                    (pending.find(p => p.groupId._id === currentGroupId)?.expectedItems || [])
                      .map(i => i.toLowerCase())
                      .every(i => returnedItemsInput.map(j => j.toLowerCase()).includes(i))
                      ? "#28a745"
                      : "#ffc107",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {loadingApproveId !== null
                  ? "Saving..."
                  : (pending.find(p => p.groupId._id === currentGroupId)?.expectedItems || [])
                      .map(i => i.toLowerCase())
                      .every(i => returnedItemsInput.map(j => j.toLowerCase()).includes(i))
                  ? "✅ Approve"
                  : "❗ Not Complete"}
              </button>
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
