import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiLogOut,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiSettings,

} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { FaComments } from "react-icons/fa"; // ✅ Add this


import { useSelector, useDispatch } from "react-redux"; // ✅ Redux
import { logout } from "../../redux/slices/authSlice"; // ✅ your logout action
import "./FacultySidebar.css";

function FacultySidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user); // ✅ Redux state

  const handleLogout = () => {
    localStorage.clear(); // Clear token
    dispatch(logout()); // ✅ Optional: clear Redux user state too
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar-modern">
      {/* 🔵 Top Logo */}
      <div className="sidebar-header">
        <div className="header-icon-title">
          <div className="icon-badge">
            <FaGraduationCap className="icon-inside" />
          </div>
          <div>
            <h2 className="portal-title">Faculty Portal</h2>
            <p className="subtitle">Clearance Management</p>
          </div>
        </div>
      </div>

      {/* 👤 Profile Section */}
      <div className="profile-section">
        <div className="profile-avatar">
          <img
            src="/images/avatar.png"
            alt="Faculty Member"
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

      {/* 📚 Sidebar Links */}
      <div className="sidebar-content">
        <ul className="sidebar-links">
          <li className={isActive("/faculty/dashboard") ? "active" : ""}>
            <RiDashboardHorizontalLine />
            <Link to="/faculty/dashboard">Dashboard</Link>
          </li>
          <li className={isActive("/faculty/group-members") ? "active" : ""}>
            <FiUsers />
            <Link to="/faculty/group-members">Group Members</Link>
          </li>
          <li className={isActive("/faculty/approved") ? "active" : ""}>
            <FiCheckCircle />
            <Link to="/faculty/approved">Approved Clearances</Link>
          </li>
          <li className={isActive("/faculty/rejected") ? "active" : ""}>
            <FiXCircle />
            <Link to="/faculty/rejected">Rejected Clearances</Link>
          </li>
        <li className={isActive("/faculty/chat") ? "active" : ""}>
  <FaComments />
  <Link to="/faculty/chat">Chat Inbox</Link>
</li>
          <li className={isActive("/faculty/profile") ? "active" : ""}>
            <FiUser />
            <Link to="/faculty/profile">Profile</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FacultySidebar;
