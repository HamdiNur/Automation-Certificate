import React from "react";
import { Link } from "react-router-dom";
import "./FacultySidebar.css"

function FacultySidebar() {
  return (
    <div className="sidebar-modern">
      <h2 className="logo">Faculty Portal</h2>
      <ul>
        <li><Link to="/faculty/dashboard">Dashboard</Link></li>
        <li><Link to="/faculty/requests">Requests</Link></li>
        <li><Link to="/faculty/profile">Profile</Link></li>
      </ul>
    </div>
  );
}

export default FacultySidebar;
