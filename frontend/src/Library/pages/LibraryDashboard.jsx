import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LibrarySidebar from "../components/LibrarySidebar";
import SkeletonTable from "../../components/loaders/skeletonTable"; // adjust path if needed

import "./styles/style.css";

function LibraryDashboard() {
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [loadingApproveId, setLoadingApproveId] = useState(null);
    const [loading, setLoading] = useState(true);


  const BASE_URL = "http://localhost:5000/api/library";

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}`);
      const all = res.data;
      const approved = all.filter(item => item.status === "Approved").length;
      const pendingCount = all.filter(item => item.status === "Pending").length;
      const rejected = all.filter(item => item.status === "Rejected").length;
      setStats({ approved, pending: pendingCount, rejected });
    } catch (err) {
      console.error("Error fetching stats", err);
    }
  };

const fetchPending = useCallback(async () => {
  setLoading(true); // <-- Start loading
  try {
    const res = await axios.get(`${BASE_URL}/pending`);
    const allPending = res.data;
    const filtered = allPending.filter((rec) =>
      `${rec.groupId?.groupNumber || ""}`.toLowerCase().includes(search.toLowerCase()) ||
      `${rec.groupId?.projectTitle || ""}`.toLowerCase().includes(search.toLowerCase())
    );
    setPending(filtered);
  } catch (err) {
    console.error("Error fetching pending records", err);
  } finally {
    setLoading(false); // <-- Stop loading
  }
}, [search]);


  useEffect(() => {
    fetchStats();
    fetchPending();
  }, [fetchPending]);

  // ✅ Setup socket listener
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("📡 Library Socket connected:", socket.id);
    });

    socket.on("library:new-pending", (data) => {
      console.log("📢 New group pending for library:", data);
      fetchPending();
      fetchStats();
      toast.info("📚 New group ready for Library clearance!");
    });

    return () => socket.disconnect();
  }, [fetchPending]);

  const handleApprove = async (groupId) => {
    try {
      setLoadingApproveId(groupId);
      const staffId = localStorage.getItem("userId");
      await axios.post(`${BASE_URL}/approve`, {
        groupId,
        libraryStaffId: staffId,
      });

      setPending((prev) => prev.filter(item => item.groupId._id !== groupId));
      setStats(prev => ({
        ...prev,
        approved: prev.approved + 1,
        pending: prev.pending - 1
      }));
      setExpandedRow(null);
      toast.success("✅ Group approved successfully.");
    } catch (err) {
      console.error("Approval failed:", err.response?.data || err.message);
      toast.error("❌ Approval failed.");
    } finally {
      setLoadingApproveId(null);
    }
  };

  const handleReject = async (groupId) => {
    const remarks = prompt("Enter reason for rejection:");
    if (!remarks) return;

    try {
      await axios.post(`${BASE_URL}/reject`, {
        groupId,
        remarks,
        libraryStaffId: localStorage.getItem("userId")
      });

      await fetchPending();
      await fetchStats();
      setExpandedRow(null);
      toast.error("❌ Group rejected.");
    } catch (err) {
      console.error("Rejection failed:", err);
      toast.error("Rejection failed. Please try again.");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h2>📚 Library Dashboard</h2>
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

        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search by group number or project title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPending()}
          />
          <button onClick={fetchPending}>Search</button>
        </div>

        <div className="pending-table">
          <h3>📝 Pending Group Thesis Returns</h3>
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Project Title</th>
                <th>Faculty Cleared</th>
                <th>Thesis Received</th>
                <th>Status</th>
                <th>Action</th>
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
                pending.map((rec) => (
                  <React.Fragment key={rec._id}>
                    <tr>
                      <td>{rec.groupId?.groupNumber ? `Group ${rec.groupId.groupNumber}` : "-"}</td>
                      <td>{rec.groupId?.projectTitle || "—"}</td>
                      <td>
                        <span className={`badge ${rec.facultyCleared ? "badge-success" : "badge-danger"}`}>
                          {rec.facultyCleared ? "Cleared" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${rec.thesisBookReveiced ? "badge-success" : "badge-danger"}`}>
                          {rec.thesisBookReveiced ? "Received" : "Missing"}
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
                          <div style={{ backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
                            <p><strong>📘 Members:</strong></p>
                            <ul>
                              {rec.members.map((m) => (
                                <li key={m._id}>{m.fullName} ({m.studentId})</li>
                              ))}
                            </ul>

                            <div style={{ marginTop: "10px" }}>
                              <button
                                className="btn-approve"
                                onClick={() => handleApprove(rec.groupId._id)}
                                disabled={loadingApproveId === rec.groupId._id}
                              >
                                {loadingApproveId === rec.groupId._id ? "Approving..." : "✅ Approve"}
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
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default LibraryDashboard;
