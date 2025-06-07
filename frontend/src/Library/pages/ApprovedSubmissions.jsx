import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

function ApprovedSubmissions() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupHistory, setGroupHistory] = useState([]);

  useEffect(() => {
    fetchApproved();
  }, []);

  const fetchApproved = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/library");
      const approvedOnly = res.data.filter(item => item.status === "Approved");
      setRecords(approvedOnly);
      setFiltered(approvedOnly);
    } catch (err) {
      console.error("Error fetching approved records", err);
    } finally {
      setLoading(false);
    }
  };

const handleSearch = (e) => {
  const value = e.target.value.trim().toLowerCase();
  setSearchTerm(value);

  const filteredData = records.filter((rec) => {
    const group = rec.groupId?.groupNumber?.toString() || "";
    const title = rec.groupId?.projectTitle?.toLowerCase() || "";

    // ✅ Extract group number if input contains "group"
    const groupMatch = value.match(/group\s*(\d+)/i);
    const exactGroupNumber = groupMatch ? groupMatch[1] : null;

    // ✅ Match exact group number or project title
    return (
      (exactGroupNumber && group === exactGroupNumber) ||
      group === value ||                     // if just number
      title.includes(value)                 // project title match
    );
  });

  setFiltered(filteredData);
};

  const fetchGroupHistory = async (groupId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/library/history/${groupId}`);
      setGroupHistory(res.data.history || []);
      setShowHistory(true);
    } catch (err) {
      console.error("❌ Error fetching history:", err.response?.data || err.message);
      alert("Failed to fetch group history.");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>✅ Approved Submissions</h2>

        {/* 🔍 Search bar */}
        <div className="filter-bar" style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by group number or project title..."
            value={searchTerm}
            onChange={handleSearch}
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
          <p>Loading approved submissions...</p>
        ) : filtered.length === 0 ? (
          <p>No approved submissions found.</p>
        ) : (
          <div className="pending-table">
            <table>
              <thead>
                <tr>
                 <th>Group</th>
<th>Project Title</th> {/* ✅ NEW COLUMN */}
<th>Faculty Cleared</th>
<th>Thesis Received</th>
<th>Status</th>
<th>Approved On</th>
<th>Actions</th>

                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => (
                  <tr key={rec._id}>
<td>{rec.groupId?.groupNumber ? `Group ${rec.groupId.groupNumber}` : "-"}</td>
               <td>{rec.groupId?.projectTitle || "Untitled"}</td>

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
                      <span className="badge badge-success">Approved</span>
                    </td>
                    <td>
                      {rec.clearedAt ? new Date(rec.clearedAt).toLocaleDateString() : "—"}
                    </td>
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
                          to={`/library/group/${rec.groupId?._id}`}
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

      {/* 📘 History Modal */}
      {showHistory && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🕘 Library History — Group {selectedGroup.groupId?.groupNumber}</h3>
            <ul>
              {groupHistory.length === 0 ? (
                <li>No history found.</li>
              ) : (
                groupHistory.map((h, i) => (
                  <li key={i} style={{ marginBottom: "1rem" }}>
                    <strong>Status:</strong> {h.status} <br />
                    <strong>Reason:</strong> {h.reason || "—"} <br />
                    <strong>By:</strong>{" "}
                    {h.actor ? (
                      <>
                        {h.actor.fullName} ({h.actor.role})
                      </>
                    ) : (
                      "Unknown"
                    )} <br />
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

export default ApprovedSubmissions;
