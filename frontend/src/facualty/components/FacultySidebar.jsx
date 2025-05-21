import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi"; // Exit icon
import "./FacultySidebar.css";

function FacultySidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Optional: Clear session or token here if used
    navigate("/");
  };

  return (
    <div className="sidebar-modern">
      <h2 className="logo">Faculty Portal</h2>
      <ul>
        <li><Link to="/faculty/dashboard">Dashboard</Link></li>
        <li><Link to="/faculty/requests">Requests</Link></li>
        <li><Link to="/faculty/profile">Profile</Link></li>
        <li onClick={handleLogout} style={{ cursor: "pointer", marginTop: "30px", color: "0d2d63" }}>
          <FiLogOut style={{ marginRight: "8px" }} />
          Exit
        </li>
      </ul>
    </div>
  );
}

export default FacultySidebar;
