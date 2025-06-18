"use client";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaUser,
  FaCheckCircle,
  FaFileInvoiceDollar,
  FaSignOutAlt,
  FaComments,
  FaCog,
} from "react-icons/fa";
import { FaGraduationCap } from "react-icons/fa";

import { RiDashboardHorizontalLine } from "react-icons/ri";

import { useUser } from "../../context/UserContext"; // ✅ Import the context
import "./FinanceSidebar.css";

function FinanceSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser(); // ✅ Get user from context

  const handleExit = () => {
    // localStorage.clear(); // Optional
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar-modern">
          <div className="sidebar-header">
              <div className="header-icon-title">
                <div className="icon-badge">
                  <FaGraduationCap className="icon-inside" />
                </div>
                <div>
                  <h2 className="portal-title">Finance Portal</h2>
                  <p className="subtitle">Clearance Management</p>
                </div>
              </div>
            </div>

      <div className="profile-section">
        <div className="profile-avatar">
          <img src="/images/avatar.png" alt="Finance Member" className="avatar-image" />
        </div>
        <h3 className="profile-name">
          {user?.fullName || "Dr. Finance Member"}
        </h3>
        <span className="profile-role">{user?.role || "Finance"}</span>

        <div className="profile-actions">
          <button className="action-btn">
            <FaCog size={14} />
          </button>
          <button className="action-btn logout-btn" onClick={handleExit}>
            <FaSignOutAlt size={14} />
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        <ul className="sidebar-links">
        <li className={isActive("/finance/dashboard") ? "active" : ""}>
  <RiDashboardHorizontalLine />
  <Link to="/finance/dashboard">Dashboard</Link>
</li>
          <li className={isActive("/finance/payments") ? "active" : ""}>
            <FaMoneyBillWave />
            <Link to="/finance/payments">Payments</Link>
          </li>
          {/* <li className={isActive("/finance/pending") ? "active" : ""}>
            <FaCheckCircle />
            <Link to="/finance/pending">Pending Approvals</Link>
          </li> */}
          <li className={isActive("/finance/graduation-paid") ? "active" : ""}>
            <FaFileInvoiceDollar />
            <Link to="/finance/graduation-paid">Graduation Paid</Link>
          </li>
          <li className={isActive("/finance/chat") ? "active" : ""}>
            <FaComments />
            <Link to="/finance/chat">Chat Inbox</Link>
          </li>
          <li className={isActive("/finance/profile") ? "active" : ""}>
            <FaUser />
            <Link to="/finance/profile">Profile</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FinanceSidebar;
