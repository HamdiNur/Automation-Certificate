import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiLogOut,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiSettings,
} from "react-icons/fi";
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { FaFlask,FaComments } from "react-icons/fa";


import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import "./LabSidebar.css";

function LabSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    localStorage.clear();
    dispatch(logout());
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar-modern">
      {/* 🧪 Lab Icon Header */}
      <div className="sidebar-header">
        <div className="header-icon-title">
          <div className="icon-badge">
            <FaFlask className="icon-inside" />
          </div>
          <div>
            <h2 className="portal-title">Lab Portal</h2>
            <p className="subtitle">Clearance Management</p>
          </div>
        </div>
      </div>

      {/* 👤 Profile Info */}
      <div className="profile-section">
        <div className="profile-avatar">
          <img
            src="/images/avatar.png"
            alt="Lab Member"
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

      {/* 📚 Navigation */}
      <div className="sidebar-content">
        <ul className="sidebar-links">
          <li className={isActive("/lab/dashboard") ? "active" : ""}>
            <RiDashboardHorizontalLine />
            <Link to="/lab/dashboard">Dashboard</Link>
          </li>
          <li className={isActive("/lab/approved") ? "active" : ""}>
            <FiCheckCircle />
            <Link to="/lab/approved">Approved Returns</Link>
          </li>
          <li className={isActive("/lab/rejected") ? "active" : ""}>
            <FiXCircle />
            <Link to="/lab/rejected">Rejected Returns</Link>
          </li>
          <li className={isActive("/lab/chat") ? "active" : ""}>
  <FaComments />
  <Link to="/lab/chat">Chat Inbox</Link>
</li>
          <li className={isActive("/lab/profile") ? "active" : ""}>
            <FiUser />
            <Link to="/lab/profile">Profile</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default LabSidebar;
