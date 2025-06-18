import React, { useEffect, useState } from "react";
import axios from "axios";
import FacultySidebar from "../components/FacultySidebar";
import SkeletonTable from "../../components/loaders/skeletonTable"; // adjust the path if needed

import "./styling/style.css";

function RejectedFacultyClearance() {
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Search term state

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRejected();
  }, []);

  const fetchRejected = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/faculty/rejected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRejected(res.data);
    } catch (err) {
      console.error("❌ Error fetching rejected:", err.response?.data || err.message);
      alert("Failed to fetch rejected faculty groups.");
    } finally {
      setLoading(false);
    }
  };

const handleMarkReadyAgain = async (groupId) => {
  const confirm = window.confirm("Are you sure you want to mark this request as ready again?");
  if (!confirm) return;

  const role = localStorage.getItem("role");
  const route =
    role === "student"
      ? "http://localhost:5000/api/faculty/mark-ready-again"
      : "http://localhost:5000/api/faculty/admin/mark-ready-again";

  try {
    await axios.patch(
      route,
      { groupId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("✅ Marked as ready again. Status is now 'Pending'.");
    fetchRejected();
  } catch (err) {
    console.error("❌ Error marking ready again:", err.response?.data || err.message);
    alert("Failed to mark as ready again.");
  }
};


  // Filter rejected groups by search term (group number or project title)
  const filteredRejected = rejected.filter((f) => {
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
        <h2>❌ Rejected Faculty Clearances</h2>

        {/* Search bar */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by group number or project title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
  <SkeletonTable rows={5} cols={6} />
        ) : filteredRejected.length === 0 ? (
          <p>No rejected faculty clearances found.</p>
        ) : (
          <table className="rejected-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Project Title</th>
                <th>Date</th>
                <th>Status</th>
                <th>Rejection Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRejected.map((f) => (
                <tr key={f._id}>
                  <td>Group {f.groupId?.groupNumber || "-"}</td>
                  <td>{f.groupId?.projectTitle || "Untitled"}</td>
                  <td>{new Date(f.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <span className="badge badge-pending rejected">Rejected</span>
                  </td>
                  <td>{f.rejectionReason || "—"}</td>
                  <td>
                    <button
                      className="badge badge-pending clickable"
                      title="Resubmit after corrections"
                      onClick={() => handleMarkReadyAgain(f.groupId._id)}
                    >
                      🔁 Mark Ready
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

export default RejectedFacultyClearance;
