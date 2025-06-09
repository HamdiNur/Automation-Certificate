import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LabSidebar from "../components/LabSidebar";
import "./style/style.css";

function ApprovedLabClearances() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchApprovedLabs();
  }, []);

  const fetchApprovedLabs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lab");
      const approvedOnly = res.data.filter(item => item.status === "Approved");
      setRecords(approvedOnly);
    } catch (err) {
      console.error("Error fetching approved lab records", err);
      alert("Failed to fetch approved lab clearances.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(rec => {
    const group = rec.groupId?.groupNumber?.toString() || "";
    const search = searchTerm.trim().toLowerCase();
    return (
      group.includes(search) ||
      `group ${group}`.includes(search) ||
      `group${group}`.includes(search)
    );
  });

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <h2>✅ Approved Lab Clearances</h2>

        {/* 🔍 Search Bar */}
        <div className="filter-bar" style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by group number..."
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

        <div className="pending-table">
          {loading ? (
            <p>Loading approved lab clearances...</p>
          ) : filteredRecords.length === 0 ? (
            <p>No approved lab records found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Members</th>
                  <th>Returned Items</th>
                  <th>Issues</th>
                  <th>Status</th>
                  <th>Approved On</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(rec => (
                  <tr key={rec._id}>
                    <td>{rec.groupId?.groupNumber || "-"}</td>
                    <td>
                      {rec.members.map(m => (
                        <div key={m._id} className="member-name">{m.fullName}</div>
                      ))}
                    </td>
                    <td>
  {Array.isArray(rec.returnedItems)
    ? rec.returnedItems
        .map(i => i.trim())
        .filter(i => i)
        .join(", ") || <span className="badge badge-danger">❌ Not Returned</span>
    : typeof rec.returnedItems === "string" && rec.returnedItems.trim()
    ? rec.returnedItems
    : <span className="badge badge-danger">❌ Not Returned</span>}
</td>

                    <td>{rec.issues || "—"}</td>
                    <td><span className="badge badge-success">Approved</span></td>
                    <td>{rec.clearedAt ? new Date(rec.clearedAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApprovedLabClearances;
