import React, { useEffect, useState } from "react";
import axios from "axios";
import LabSidebar from "../components/LabSidebar";
import SkeletonTable from "../../components/loaders/skeletonTable"; // adjust path if needed

import "./style/style.css";

function RejectedLabReturns() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRejected();
  }, []);

  const fetchRejected = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lab");
      const rejectedOnly = res.data.filter(item => item.status === "Rejected");
      setRecords(rejectedOnly);
    } catch (err) {
      console.error("Error fetching rejected lab records", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReadyAgain = async (groupId) => {
    const confirm = window.confirm("Are you sure you want to mark this lab return as ready again?");
    if (!confirm) return;

    setProcessingId(groupId);

    try {
      await axios.patch(
        "http://localhost:5000/api/lab/admin/mark-ready-again",
        { groupId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("✅ Marked as ready again.");
      fetchRejected(); // Refresh after update
    } catch (err) {
      console.error("❌ Error marking lab ready again:", err.response?.data || err.message);
      alert("Failed to mark lab as ready again.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRecords = records.filter(rec => {
    const groupNumber = rec.groupId?.groupNumber?.toString() || "";
    const search = searchTerm.trim().toLowerCase();
    return groupNumber.includes(search);
  });

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <h2>❌ Rejected Lab Returns</h2>

        {/* 🔍 Search Bar */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by group number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 🌀 Loading or Table */}
        {loading ? (
<SkeletonTable rows={6} cols={7} />
        ) : filteredRecords.length === 0 ? (
          <p>No rejected lab records found.</p>
        ) : (
          <table className="rejected-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Members</th>
                <th>Returned Items</th>
                <th>Status</th>
                <th>Issues</th>
                <th>Rejected At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(rec => (
                <tr key={rec._id}>
                  <td>Group {rec.groupId?.groupNumber || "-"}</td>
                  <td>
                    {rec.members?.map(m => (
                      <div key={m._id} className="member-name">{m.fullName}</div>
                    )) || "-"}
                  </td>
                  <td>
                    {Array.isArray(rec.returnedItems) && rec.returnedItems.length > 0
                      ? rec.returnedItems.join(", ")
                      : typeof rec.returnedItems === "string" && rec.returnedItems.trim()
                      ? rec.returnedItems
                      : <span className="badge badge-danger">❌ Not Returned</span>}
                  </td>
                  <td><span className="badge badge-danger">Rejected</span></td>
                  <td>{rec.issues || "—"}</td>
                  <td>{rec.updatedAt ? new Date(rec.updatedAt).toLocaleDateString() : "—"}</td>
                  <td>
                    <button
                      className="badge badge-pending clickable"
                      disabled={processingId === rec.groupId?._id}
                      onClick={() => handleMarkReadyAgain(rec.groupId._id)}
                      title="Resubmit after corrections"
                    >
                      {processingId === rec.groupId?._id ? "Processing..." : "🔁 Mark Ready"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RejectedLabReturns;
