import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiLogOut,
  FiCalendar,
  FiUser,
  FiSettings,
  FiClipboard,
  FiEdit,
  FiBookOpen,
} from "react-icons/fi";
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { FaUserGraduate } from "react-icons/fa";
import { useUser } from "../../context/UserContext"; // Adjust path if needed
import "./Sidebar.css"; // Reuse FacultySidebar.css as Sidebar.css

function Sidebar() {
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
      {/* ⚙️ Header */}
      <div className="sidebar-header">
        <div className="header-icon-title">
          <div className="icon-badge">
  <FaUserGraduate className="icon-inside" />
</div>
          <div>
            <h2 className="portal-title">Admin Panel</h2>
            <p className="subtitle">System Dashboard</p>
          </div>
        </div>
      </div>

      {/* 👤 Profile */}
      <div className="profile-section">
        <div className="profile-avatar">
          <img
            src="/images/avatar.png"
            alt="Admin"
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

      {/* 🧭 Navigation */}
      <div className="sidebar-content">
        <ul className="sidebar-links">
          <li className={isActive("/dashboard") ? "active" : ""}>
            <RiDashboardHorizontalLine />
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className={isActive("/requests") ? "active" : ""}>
            <FiClipboard />
            <Link to="/requests">Clearances</Link>
          </li>
          <li className={isActive("/appointments") ? "active" : ""}>
            <FiCalendar />
            <Link to="/appointments">Appointments</Link>
          </li>
          <li className={isActive("/name-corrections") ? "active" : ""}>
            <FiEdit />
            <Link to="/name-corrections">Name Corrections</Link>
          </li>
          <li className={isActive("/courses") ? "active" : ""}>
            <FiBookOpen />
            <Link to="/courses">Courses</Link>
          </li>
          <li className={isActive("/users") ? "active" : ""}>
            <FiUser />
            <Link to="/users">Users</Link>
          </li>
          <li className={isActive("/profile") ? "active" : ""}>
            <FiSettings />
            <Link to="/profile">Profile</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
