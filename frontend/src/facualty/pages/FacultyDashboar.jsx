import React from "react";
import FacultySidebar from "../components/FacultySidebar";
import "./styling/style.css"
function FacultyDashboard() {
  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>Welcome, Faculty Member 👋</h2>

        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>Pending Requests</h3>
            <p>3</p>
          </div>
          <div className="widget-card">
            <h3>Approved</h3>
            <p>5</p>
          </div>
          <div className="widget-card">
            <h3>Rejected</h3>
            <p>1</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
