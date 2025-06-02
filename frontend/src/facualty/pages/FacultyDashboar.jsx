import React, { useEffect, useState } from "react";
import FacultySidebar from "../components/FacultySidebar";
import axios from "axios";
import "./styling/style.css";

function FacultyDashboard() {
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
const res = await axios.get("http://localhost:5000/api/faculty/status-count");
        setCounts(res.data);
      } catch (err) {
        console.error("❌ Error fetching dashboard counts:", err.message);
      }
    };

    fetchCounts();
  }, []); // Only fetch once on load (optional: use a signal to refresh later)

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>Welcome, Faculty Member 👋</h2>

        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>Pending Requests</h3>
            <p className="pending">{counts.pending}</p>
          </div>
          <div className="widget-card">
            <h3>Approved</h3>
            <p className="approved">{counts.approved}</p>
          </div>
          <div className="widget-card">
            <h3>Rejected</h3>
            <p className="rejected">{counts.rejected}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
