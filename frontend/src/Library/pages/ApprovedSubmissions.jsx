import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

function ApprovedSubmissions() {
  const [records, setRecords] = useState([]);

  const fetchApproved = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/library");
      const approvedOnly = res.data.filter(item => item.status === "Approved");
      setRecords(approvedOnly);
    } catch (err) {
      console.error("Error fetching approved records", err);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>✅ Approved Submissions</h2>

        <div className="pending-table">
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Members</th>
                <th>Faculty Cleared</th>
                <th>Thesis Received</th>
                <th>Status</th>
                <th>Approved On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="7">No approved submissions found.</td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec._id}>
                    <td>{rec.groupId?.groupNumber || "-"}</td>
                    <td>
                      {rec.members.map((m) => (
                        <div key={m._id} className="member-name">{m.fullName}</div>
                      ))}
                    </td>
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
                      {rec.groupId?._id ? (
                        <Link to={`/library/group/${rec.groupId._id}`}>
                          <button className="btn-view">👁 View</button>
                        </Link>
                      ) : (
                        "—"
                      )}
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

export default ApprovedSubmissions;
