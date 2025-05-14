import React from "react";
import { Link } from "react-router-dom";
import { FaTachometerAlt, FaMoneyBillWave, FaUser } from "react-icons/fa";

function FinanceSidebar() {
  return (
    <div className="sidebar-modern">
      <h2 className="logo">Finance</h2>
      <ul>
        <li><FaTachometerAlt /> <Link to="/finance/dashboard">Dashboard</Link></li>
        <li><FaMoneyBillWave /> <Link to="/finance/payments">Payments</Link></li>
        <li><FaUser /> <Link to="/finance/profile">Profile</Link></li>
      </ul>
    </div>
  );
}

export default FinanceSidebar;
