// 📁 src/Finance/pages/FinanceDashboard.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import FinanceSidebar from "../components/FinanceSidebar";
import "./FinanceDashboard.css"; // we'll create this CSS file

function FinanceDashboard() {
  const [stats, setStats] = useState({
    graduationFeePaid: 0,
    pendingPayments: 0,
   
    totalCollected: 0
  });

  useEffect(() => {
    axios.get("http://localhost:5000/api/finance/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error("Failed to fetch stats", err));
  }, []);

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <h2>Finance Dashboard</h2>
        <div className="finance-widgets">
          <div className="widget-card">
            <h3>Graduation Fee Paid</h3>
            <p>{stats.graduationFeePaid}</p>
          </div>
          <div className="widget-card">
            <h3>Pending Payments</h3>
            <p>{stats.pendingPayments}</p>
          </div>
          <div className="widget-card">
            <h3>Total Collected ($)</h3>
            <p>${stats.totalCollected.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinanceDashboard;
