import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LabSidebar from "../components/LabSidebar";
import SkeletonTable from "../../components/loaders/skeletonTable"; // Adjust path if needed

import "./style/style.css"; // Make sure this contains .badge, .btn-icon etc.

function ApprovedLabClearances() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupHistory, setGroupHistory] = useState([]);

  useEffect(() => {
    fetchApprovedLabs();
  }, []);

  const fetchApprovedLabs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lab");
      const approvedOnly = res.data
      .filter(item => item.status === "Approved")   
.sort((a, b) => new Date(a.clearedAt) - new Date(b.clearedAt));
;
      
      setRecords(approvedOnly);
    } catch (err) {
      console.error("Error fetching approved lab records", err);
      alert("Failed to fetch approved lab clearances.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupHistory = async (groupId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/lab/history/${groupId}`);
      setGroupHistory(res.data.history || []);
      setShowHistory(true);
    } catch (err) {
      console.error("❌ Error fetching history:", err.response?.data || err.message);
      alert("Failed to fetch group history.");
    }
  };

  const filteredRecords = records.filter(rec => {
    const group = rec.groupId?.groupNumber?.toString() || "";
    const title = rec.groupId?.projectTitle?.toLowerCase() || "";
    const search = searchTerm.trim().toLowerCase();

    return (
      group === search ||
      title.includes(search) ||
      `group ${group}`.includes(search) ||
      `group${group}`.includes(search)
    );
  });

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <h2>✅ Approved Returns</h2>

        {/* 🔍 Search Bar */}
        <div className="filter-bar" style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by group number or project title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '300px',
              padding: '10px 15px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        {loading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : filteredRecords.length === 0 ? (
          <p>No approved lab records found.</p>
        ) : (
          <div className="pending-table">
            <table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Project Title</th>
                  <th>Returned Items</th>
                  <th>Issues</th>
                  <th>Status</th>
                  <th>Approved On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(rec => (
                  <tr key={rec._id}>
                    <td>{rec.groupId?.groupNumber ? `Group ${rec.groupId.groupNumber}` : "-"}</td>
                    <td>{rec.groupId?.projectTitle || "Untitled"}</td>
                    <td>
                      {rec.expectedItems?.length === 0 ? (
                        <span className="badge badge-info">Not Required</span>
                      ) : Array.isArray(rec.returnedItems) && rec.returnedItems.length > 0 ? (
                        rec.returnedItems.map(i => i.trim()).filter(i => i).join(", ")
                      ) : (
                        <span className="badge badge-danger">❌ Not Returned</span>
                      )}
                    </td>
                    <td>{rec.issues || "—"}</td>
                    <td><span className="badge badge-success">Approved</span></td>
                    <td>{rec.clearedAt ? new Date(rec.clearedAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          title="View History"
                          onClick={() => {
                            setSelectedGroup(rec);
                            fetchGroupHistory(rec.groupId?._id);
                          }}
                        >
                          🕘
                        </button>
                        <Link
                          className="btn-icon"
                          title="View Members"
                          to={`/lab/group/${rec.groupId?._id}`}
                        >
                          📄
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 📘 Lab History Modal */}
      {showHistory && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🕘 Lab History — Group {selectedGroup.groupId?.groupNumber}</h3>
            <ul>
              {groupHistory.length === 0 ? (
                <li>No history found.</li>
              ) : (
                groupHistory.map((h, i) => (
                  <li key={i} style={{ marginBottom: "1rem" }}>
                    <strong>Status:</strong> {h.status} <br />
                    <strong>Reason:</strong> {h.reason || "—"} <br />
                    <strong>By:</strong>{" "}
                    {h.actor ? `${h.actor.fullName} (${h.actor.role})` : "Unknown"} <br />
                    <strong>Date:</strong>{" "}
                    {new Date(h.date).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </li>
                ))
              )}
            </ul>
            <button className="btn-cancel" onClick={() => setShowHistory(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovedLabClearances;
