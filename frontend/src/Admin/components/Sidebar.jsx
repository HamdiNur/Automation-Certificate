import React from "react";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaUser,
  FaCog,
  FaClipboardList,
  FaEdit
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar-modern">
      <h2 className="logo">Dashboard</h2>
      <ul>
        <li><FaTachometerAlt /> <Link to="/dashboard">Dashboard</Link></li>
        <li><FaClipboardList /> <Link to="/requests">Clearances</Link></li>
        <li><FaCalendarAlt /> <Link to="/appointments">Appointments</Link></li>
        <li><FaEdit /> <Link to="/name-corrections">Name Corrections</Link></li> {/* ✅ New */}
        <li><FaUser /> <Link to="/users">Users</Link></li>
        <li><FaCog /> <Link to="/profile">Profile</Link></li>
      </ul>
    </div>
  );
}

export default Sidebar;
