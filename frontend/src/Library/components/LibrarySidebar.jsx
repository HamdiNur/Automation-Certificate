import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiLogOut,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiSettings,
  FiClipboard,
} from "react-icons/fi";
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { FaBook } from "react-icons/fa";
import { useUser } from "../../context/UserContext"; // ✅ Reuse same context
import "./LibrarySidebar.css"; // ✅ Same structure as FacultySidebar.css

function LibrarySidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar-modern">
      {/* 📚 Library Header */}
      <div className="sidebar-header">
        <div className="header-icon-title">
          <div className="icon-badge">
            <FaBook className="icon-inside" />
          </div>
          <div>
            <h2 className="portal-title">Library Panel</h2>
            <p className="subtitle">Clearance Management</p>
          </div>
        </div>
      </div>

      {/* 👤 User Info */}
      <div className="profile-section">
        <div className="profile-avatar">
          <img
            src="/images/avatar.png"
            alt="Library Member"
            className="avatar-image"
          />
        </div>

        {user ? (
          <>
            <h3 className="profile-name">{user.fullName}</h3>
            <span className="profile-role">{user.role}</span>
          </>
        ) : (
          <p style={{ fontSize: "12px", color: "#ddd" }}>Loading...</p>
        )}

        <div className="profile-actions">
          <button className="action-btn">
            <FiSettings size={14} />
          </button>
          <button className="action-btn logout-btn" onClick={handleLogout}>
            <FiLogOut size={14} />
          </button>
        </div>
      </div>

      {/* 📁 Navigation */}
      <div className="sidebar-content">
        <ul className="sidebar-links">
          <li className={isActive("/library/dashboard") ? "active" : ""}>
            <RiDashboardHorizontalLine />
            <Link to="/library/dashboard">Dashboard</Link>
          </li>
        
          <li className={isActive("/library/approved") ? "active" : ""}>
            <FiCheckCircle />
            <Link to="/library/approved">Approved Submissions</Link>
          </li>
          <li className={isActive("/library/rejected") ? "active" : ""}>
            <FiXCircle />
            <Link to="/library/rejected">Rejected Submissions</Link>
          </li>
          <li className={isActive("/library/students") ? "active" : ""}>
            <FiUsers />
            <Link to="/library/students">Student List</Link>
          </li>
          <li className={isActive("/library/profile") ? "active" : ""}>
            <FiUser />
            <Link to="/library/profile">My Profile</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default LibrarySidebar;
