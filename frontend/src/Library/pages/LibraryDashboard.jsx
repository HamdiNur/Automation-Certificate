import React from "react";
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

function LibraryDashboard() {
  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>Library Dashboard</h2>
        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>Books Received</h3>
            <p>28</p>
          </div>
          <div className="widget-card">
            <h3>Pending Submissions</h3>
            <p>4</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LibraryDashboard;
