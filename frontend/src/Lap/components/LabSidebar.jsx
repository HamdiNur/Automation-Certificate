import React from "react";
import { Link } from "react-router-dom";
import { FaTachometerAlt, FaClipboardCheck, FaUser } from "react-icons/fa";
import "./LabSidebar.css";
function LabSidebar() {
  return (
    <div className="sidebar-modern">
      <h2 className="logo">Lab Portal</h2>
      <ul>
        <li><FaTachometerAlt /> <Link to="/lab/dashboard">Dashboard</Link></li>
        <li><FaClipboardCheck /> <Link to="/lab/equipment">Equipment Check</Link></li>
        <li><FaUser /> <Link to="/lab/profile">Profile</Link></li>
      </ul>
    </div>
  );
}

export default LabSidebar;
