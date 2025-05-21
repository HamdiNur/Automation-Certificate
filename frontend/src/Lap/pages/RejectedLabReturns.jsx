import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import LabSidebar from "../components/LabSidebar";
import "./style/style.css"; // Adjust path if needed

function RejectedLabReturns() {
  const [records, setRecords] = useState([]);

  const fetchRejected = async () => {
    try {
      const res = await axios.get("/lab");
      const rejectedOnly = res.data.filter(item => item.status === "Rejected");
      setRecords(rejectedOnly);
    } catch (err) {
      console.error("Error fetching rejected lab records", err);
    }
  };

  useEffect(() => {
    fetchRejected();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <h2>❌ Rejected Lab Returns</h2>

        <div className="pending-table">
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Members</th>
                <th>Returned Items</th>
                <th>Status</th>
                <th>Issues</th>
                <th>Rejected At</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="6">No rejected lab records found.</td></tr>
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
                    <td>
                      <span className="badge badge-danger">Rejected</span>
                    </td>
                    <td>{rec.issues || "—"}</td>
                    <td>{rec.updatedAt ? new Date(rec.updatedAt).toLocaleDateString() : "—"}</td>
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

export default RejectedLabReturns;
