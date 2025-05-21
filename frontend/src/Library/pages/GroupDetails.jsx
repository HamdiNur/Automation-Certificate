import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/groups/${groupId}`);
        setGroup(res.data);
      } catch (err) {
        console.error("Error fetching group details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  if (loading) {
    return <div className="dashboard-main">Loading group details...</div>;
  }

  if (!group) {
    return <div className="dashboard-main">Group not found.</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <div className="header-with-back">
          <button className="btn-back" onClick={() => navigate(-1)}>🔙 Back</button>
          <h2>📁 Group {group.groupNumber} Details</h2>
        </div>

        <div className="group-info">
          <p><strong>Program:</strong> {group.program}</p>
          <p><strong>Faculty:</strong> {group.faculty}</p>
        </div>

        <div className="pending-table">
          <h4>👥 Members</h4>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Email</th>
                <th>Clearance Status</th>
              </tr>
            </thead>
            <tbody>
              {group.members.map((student) => (
                <tr key={student._id}>
                  <td>{student.fullName}</td>
                  <td>{student.studentId}</td>
                  <td>{student.email}</td>
                  <td>
                    <span className={`badge ${
                      student.clearanceStatus === "Approved"
                        ? "badge-success"
                        : student.clearanceStatus === "Rejected"
                        ? "badge-danger"
                        : "badge-pending"
                    }`}>
                      {student.clearanceStatus || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {group.clearanceProgress && (
          <div className="clearance-status">
            <h4>📊 Clearance Progress</h4>
            <ul>
              {Object.entries(group.clearanceProgress).map(([dept, status]) => (
                <li key={dept}>
                  <strong>{dept}:</strong> {status.status}
                  {status.date && ` on ${new Date(status.date).toLocaleDateString()}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupDetails;
