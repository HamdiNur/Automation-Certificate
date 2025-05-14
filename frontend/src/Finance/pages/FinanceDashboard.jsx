import React from "react";
import FinanceSidebar from "../components/FinanceSidebar";

function FinanceDashboard() {
  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <h2>Finance Dashboard</h2>
        <div className="faculty-widgets">
          <div className="widget-card">
            <h3>Paid Students</h3>
            <p>42</p>
          </div>
          <div className="widget-card">
            <h3>Pending Payments</h3>
            <p>8</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinanceDashboard;
