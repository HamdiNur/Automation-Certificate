import React, { useEffect, useState } from "react";
import axios from "axios";
import LabSidebar from "../components/LabSidebar";
import "./style/style.css";

function ApprovedLabClearances() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovedLabs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lab");
      const approvedOnly = res.data.filter(item => item.status === "Approved");
      setRecords(approvedOnly);
    } catch (err) {
      console.error("Error fetching approved lab records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedLabs();
  }, []);

  if (loading) return <div className="dashboard-main">Loading approved lab clearances...</div>;

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <h2>✅ Approved Lab Clearances</h2>

        <div className="pending-table">
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
              {records.length === 0 ? (
                <tr><td colSpan="6">No approved lab records found.</td></tr>
              ) : (
                records.map(rec => (
                  <tr key={rec._id}>
                    <td>{rec.groupId?.groupNumber || "-"}</td>
                    <td>
                      {rec.members.map(m => (
                        <div key={m._id} className="member-name">{m.fullName}</div>
                      ))}
                    </td>
                    <td>
                      {rec.returnedItems?.trim()
                        ? rec.returnedItems
                        : <span className="badge badge-danger">❌ Not Returned</span>}
                    </td>
                    <td>{rec.issues || "—"}</td>
                    <td>
                      <span className="badge badge-success">Approved</span>
                    </td>
                    <td>
                      {rec.clearedAt ? new Date(rec.clearedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ApprovedLabClearances;
