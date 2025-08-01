import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import FacultySidebar from "../components/FacultySidebar";
import SkeletonTable from "../../components/loaders/skeletonTable"; // adjust path if needed

import "./styling/style.css";

function ApprovedFacultyClearance() {
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupHistory, setGroupHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchApproved();
  }, []);

  const fetchApproved = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/faculty/approved", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApproved(res.data);
    } catch (err) {
      console.error("❌ Error fetching approved:", err.response?.data || err.message);
      alert("Failed to fetch approved faculty groups.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupHistory = async (groupId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/faculty/history/${groupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGroupHistory(res.data.history || []);
      setShowHistory(true);
    } catch (err) {
      console.error("❌ Error fetching history:", err.response?.data || err.message);
      alert("Failed to fetch group history.");
    }
  };

 const filteredApproved = approved.filter((f) => {
  const groupNumber = f.groupId?.groupNumber?.toString() || "";
  const projectTitle = f.groupId?.projectTitle?.toLowerCase() || "";
  const search = searchTerm.trim().toLowerCase();

  // Check if user is searching for group by number or "group 2" style
  const matchExactGroup =
    search === groupNumber || search === `group ${groupNumber}` || search === `group${groupNumber}`;

  // Check if it matches project title
  const matchTitle = projectTitle.includes(search);

  return matchExactGroup || matchTitle;
});

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>✅ Approved Faculty Clearances</h2>

        {/* Search bar */}
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
  <SkeletonTable rows={5} cols={5} />
        ) : filteredApproved.length === 0 ? (
          <p>No approved faculty clearances found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Project Title</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApproved.map((f) => (
                <tr key={f._id}>
                  <td>Group {f.groupId?.groupNumber || "-"}</td>
                  <td>{f.groupId?.projectTitle || "Untitled"}</td>
                  <td>
                    <span className={`badge ${f.status.toLowerCase()}`}>
                      {f.status}
                    </span>
                  </td>
<td>
  {f.clearedAt
    ? new Date(f.clearedAt).toLocaleDateString()
    : "—"}
</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        title="View History"
                        onClick={() => {
                          setSelectedGroup(f);
                          fetchGroupHistory(f.groupId._id);
                        }}
                      >
                        🕘
                      </button>
                      <Link
                        className="btn-icon"
                        title="View Members Page"
                        to={`/faculty/group/${f.groupId._id}/members`}
                      >
                        📄
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* History Modal */}
      {showHistory && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🕘 Faculty Clearance History — Group {selectedGroup.groupId.groupNumber}</h3>
            <ul>
              {groupHistory.map((h, i) => (
                <li key={i} style={{ marginBottom: "1rem" }}>
                  <strong>Status:</strong> {h.status} <br />
                  <strong>Reason:</strong> {h.reason || "—"} <br />
                  <strong>By:</strong>{" "}
                  {h.startedBy ? (
                    <>
                      {h.startedBy.fullName} (Student)
                    </>
                  ) : h.actor ? (
                    <>
                      {h.actor.fullName} ({h.actor.role})
                    </>
                  ) : (
                    "Unknown"
                  )}
                  <br />
                  <strong>Date:</strong>{" "}
                  {new Date(h.date).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </li>
              ))}
            </ul>
            <button className="btn-cancel" onClick={() => setShowHistory(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovedFacultyClearance;
