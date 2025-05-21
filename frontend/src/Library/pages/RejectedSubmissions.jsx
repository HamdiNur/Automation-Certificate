import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

function RejectedSubmissions() {
  const [records, setRecords] = useState([]);

  const fetchRejected = async () => {
    try {
      const res = await axios.get("/library");
      const rejectedOnly = res.data.filter(item => item.status === "Rejected");
      setRecords(rejectedOnly);
    } catch (err) {
      console.error("Error fetching rejected records", err);
    }
  };

  useEffect(() => {
    fetchRejected();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>❌ Rejected Submissions</h2>

        <div className="pending-table">
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Members</th>
                <th>Faculty cleared</th>
                <th>Thesis Received</th>
                <th>Status</th>
                <th>Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="6">No rejected submissions found.</td></tr>
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
                      <span className={`badge ${rec.facultyCleared ? 'badge-success' : 'badge-danger'}`}>
                        {rec.facultyCleared ? "Cleared" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${rec.thesisBookReceived ? 'badge-success' : 'badge-danger'}`}>
                        {rec.thesisBookReceived ? "Received" : "Missing"}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-danger">Rejected</span>
                    </td>
                    <td>{rec.remarks || "No remarks provided"}</td>
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

export default RejectedSubmissions;
