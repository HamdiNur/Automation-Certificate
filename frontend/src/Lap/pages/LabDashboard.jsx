import React from "react";
import LabSidebar from "../components/LabSidebar";
import "./style/style.css"
function LabDashboard() {
  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <h2>Lab Dashboard</h2>
        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>Returned Equipment</h3>
            <p>20</p>
          </div>
          <div className="widget-card">
            <h3>Not Returned</h3>
            <p>5</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabDashboard;
