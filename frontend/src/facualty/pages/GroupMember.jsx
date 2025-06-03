import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import FacultySidebar from "../components/FacultySidebar";
import "./styling/style.css";

function GroupMembersPage() {
  const { groupId } = useParams(); // if from "View Members"
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (groupId) {
      fetchById(groupId);
    }
  }, [groupId]);

  const fetchById = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/${id}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupData(res.data);
      setSearchTerm(res.data.groupNumber);
      setError("");
    } catch (err) {
      setGroupData(null);
      setError("Group not found.");
    } finally {
      setLoading(false);
    }
  };

const fetchByGroupNumber = async () => {
  if (!searchTerm) return;
  setLoading(true);

  // 🧠 Extract numeric part only (e.g., from "Group 11" → "11")
  const groupNumberOnly = searchTerm.match(/\d+/)?.[0];

  if (!groupNumberOnly) {
    setError("Please enter a valid group number.");
    setLoading(false);
    return;
  }

  try {
    const res = await axios.get(
      `http://localhost:5000/api/groups/by-number/${groupNumberOnly}/students`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setGroupData(res.data);
    setError("");
  } catch (err) {
    setGroupData(null);
    setError("Group not found or invalid number.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>👥 Group Members</h2>

        {!groupId && (
         <div className="filter-bar">
  <input
    type="text"
    placeholder="Search by group number..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") fetchByGroupNumber();
    }}
  />
  <button className="ml-2 btn-approve" onClick={fetchByGroupNumber}>
    Search
  </button>
</div>

        )}

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {groupData && (
          <div className="group-details bg-white shadow rounded p-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Group #{groupData.groupNumber}</h3>
            <p><strong>Program:</strong> {groupData.program}</p>
            <p><strong>Project Title:</strong> {groupData.projectTitle || "Untitled"}</p>

            <h4 className="mt-4 font-semibold">Members</h4>
            <table className="min-w-full mt-2 text-sm">
              <thead>
  <tr className="bg-gray-100">
    <th className="p-2 text-left">Student ID</th>
    <th className="p-2 text-left">Full Name</th>
    <th className="p-2 text-left">Role</th>
    <th className="p-2 text-left">Mode</th>
    <th className="p-2 text-left">Class</th>
    <th className="p-2 text-left">Student Status</th>
    <th className="p-2 text-left">Faculty Clearance</th>
  </tr>
</thead>

            <tbody>
  {groupData.members.map((m, i) => (
    <tr key={i} className="border-b">
      <td className="p-2">{m.studentId}</td>
      <td className="p-2">{m.fullName}</td>
      <td className="p-2">{m.role}</td>
      <td className="p-2">{m.mode}</td>
      <td className="p-2">{m.studentClass}</td>
      <td className="p-2">{m.status}</td> {/* Student Status */}
      <td className="p-2">
  <span className={`badge ${
    groupData.clearanceProgress?.faculty?.status === "Approved"
      ? "badge-success"
      : groupData.clearanceProgress?.faculty?.status === "Rejected"
      ? "badge-danger"
      : groupData.clearanceProgress?.faculty?.status === "Pending"
      ? "badge-warning"
      : "badge-default"
  }`}>
    {groupData.clearanceProgress?.faculty?.status || "Not Started"}
  </span>
</td>

    </tr>
  ))}
</tbody>

            </table>

            {!groupId && (
              <button
                onClick={() => {
                  setGroupData(null);
                  setSearchTerm("");
                }}
                className="mt-4 bg-gray-400 text-white px-4 py-2 rounded"
              >
                🔙 Back to Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupMembersPage;
