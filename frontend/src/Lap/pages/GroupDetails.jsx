import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import LabSidebar from "../components/LabSidebar";
import "./style/style.css";

function LabGroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/groups/${groupId}/students`);
        setGroup(res.data);
      } catch (err) {
        console.error("Error fetching group details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  if (loading) return <div className="dashboard-main">Loading group details...</div>;
  if (!group) return <div className="dashboard-main">Group not found.</div>;

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <div className="header-with-back">
          <button className="btn-back" onClick={() => navigate(-1)}>🔙 Back</button>
          <h2>🧪 Lab Group {group.groupNumber} Details</h2>
        </div>

        <div className="group-info">
          <p><strong>Program:</strong> {group.program}</p>
          <p><strong>Project Title:</strong> {group.projectTitle || "N/A"}</p>
        </div>

        <div className="pending-table">
          <h4>👥 Members</h4>
          <table className="min-w-full mt-2 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Student ID</th>
                <th className="p-2 text-left">Full Name</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Mode</th>
                <th className="p-2 text-left">Class</th>
                <th className="p-2 text-left">Student Status</th>
                <th className="p-2 text-left">Lab Clearance</th>
              </tr>
            </thead>
            <tbody>
              {group.members.map((m, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{m.studentId}</td>
                  <td className="p-2">{m.fullName}</td>
                  <td className="p-2">{m.role}</td>
                  <td className="p-2">{m.mode}</td>
                  <td className="p-2">{m.studentClass}</td>
                  <td className="p-2">{m.status}</td>
                  <td className="p-2">
                    <span className={`badge ${
                      group.clearanceProgress?.lab?.status === "Approved"
                        ? "badge-success"
                        : group.clearanceProgress?.lab?.status === "Rejected"
                        ? "badge-danger"
                        : group.clearanceProgress?.lab?.status === "Pending"
                        ? "badge-warning"
                        : "badge-default"
                    }`}>
                      {group.clearanceProgress?.lab?.status || "Not Started"}
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

export default LabGroupDetails;
