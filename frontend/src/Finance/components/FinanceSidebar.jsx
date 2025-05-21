import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaMoneyBillWave,
  FaUser,
  FaCheckCircle,
  FaFileInvoiceDollar,
  FaSignOutAlt
} from "react-icons/fa";

function FinanceSidebar() {
  const navigate = useNavigate();

  const handleExit = () => {
    // Optionally clear session/localStorage
    // localStorage.clear();
    navigate("/");
  };

  return (
    <div className="sidebar-modern">
      <h2 className="logo">Finance</h2>
      <div className="sidebar-content">
        <ul className="sidebar-links">
          <li><FaTachometerAlt /> <Link to="/finance/dashboard">Dashboard</Link></li>
          <li><FaMoneyBillWave /> <Link to="/finance/payments">Payments</Link></li>
          <li><FaCheckCircle /> <Link to="/finance/pending">Pending Approvals</Link></li>
          <li><FaFileInvoiceDollar /> <Link to="/finance/graduation-paid">Graduation Paid</Link></li>
          <li><FaUser /> <Link to="/finance/profile">Profile</Link></li>
        </ul>
        <div className="sidebar-exit" onClick={handleExit}>
          <FaSignOutAlt />
          <span>Exit</span>
        </div>
      </div>
    </div>
  );
}

export default FinanceSidebar;
