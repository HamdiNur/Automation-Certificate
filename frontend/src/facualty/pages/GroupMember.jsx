import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import FacultySidebar from "../components/FacultySidebar";
import "./styling/style.css";

function GroupMembersPage() {
  const { groupId } = useParams();
  const token = localStorage.getItem("token");

  const [groupNumber, setGroupNumber] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/${groupId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupNumber(res.data.groupNumber);
      setMembers(res.data.members);
    } catch (err) {
      console.error("❌ Failed to fetch group members:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>👥 Group {groupNumber} — Members</h2>

        {loading ? (
          <p>Loading group members...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Mode</th>
                <th>Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td>{m.studentId}</td>
                  <td>{m.fullName}</td>
                  <td>{m.role}</td>
                  <td>{m.mode}</td>
                  <td>{m.studentClass}</td> {/* Changed here */}
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default GroupMembersPage;
