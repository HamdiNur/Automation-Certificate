import React, { useEffect, useState } from "react";
import axios from "axios";
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

function RejectedSubmissions() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const fetchRejected = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/library", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rejectedOnly = res.data.filter(item => item.status === "Rejected");
      setRecords(rejectedOnly);
      setFiltered(rejectedOnly);
    } catch (err) {
      console.error("Error fetching rejected records", err);
      alert("❌ Failed to fetch rejected records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejected();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.trim().toLowerCase();
    setSearchTerm(value);

    const filteredData = records.filter((rec) => {
      const group = rec.groupId?.groupNumber?.toString() || "";
      const title = rec.groupId?.projectTitle?.toLowerCase() || "";
      const match = value.match(/group\s*(\d+)/i);
      const exactGroup = match ? match[1] : null;

      return (
        (exactGroup && group === exactGroup) ||
        group === value ||
        title.includes(value)
      );
    });

    setFiltered(filteredData);
  };

  const handleMarkReadyAgain = async (groupId) => {
    const confirm = window.confirm("Are you sure you want to mark this submission as ready again?");
    if (!confirm) return;

    try {
      await axios.post(
        "http://localhost:5000/api/library/mark-again",
        { groupId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Submission marked as 'Pending' again.");
      fetchRejected();
    } catch (err) {
      console.error("❌ Mark again error:", err.response?.data || err.message);
      alert("❌ Failed to mark as ready again.");
    }
  };

  const handleRejectSubmit = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/library/reject",
        {
          groupId: selectedGroupId,
          remarks: rejectionReason,
          libraryStaffId: userId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Rejection saved.");
      setShowRejectModal(false);
      setRejectionReason("");
      fetchRejected();
    } catch (err) {
      console.error("❌ Rejection failed", err.response?.data || err.message);
      alert("❌ Failed to reject.");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>❌ Rejected Submissions</h2>

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
          <p>Loading rejected submissions...</p>
        ) : filtered.length === 0 ? (
          <p>No rejected submissions found.</p>
        ) : (
          <div className="pending-table">
            <table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Project Title</th>
                  <th>Faculty Cleared</th>
                  <th>Thesis Received</th>
                  <th>Status</th>
                  <th>Rejection Reason</th>
                  <th>Action</th>
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
                    <td><span className="badge badge-danger">Rejected</span></td>
                    <td>{rec.remarks || "No remarks provided"}</td>
                    <td>
                      <button
                        className="badge badge-pending clickable"
                        title="Resubmit after corrections"
                        onClick={() => handleMarkReadyAgain(rec.groupId?._id)}
                      >
                        🔁 Mark Ready
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 📝 Reject Modal */}
        {showRejectModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>✏️ Edit Rejection Reason</h3>
              <textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className="btn-view" onClick={handleRejectSubmit}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RejectedSubmissions;
