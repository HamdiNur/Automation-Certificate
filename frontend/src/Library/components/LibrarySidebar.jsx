import React from "react";
import { Link } from "react-router-dom";
import { FaTachometerAlt, FaBook, FaUser } from "react-icons/fa";
import "./LibrarySidebar.css";

function LibrarySidebar() {
  return (
    <div className="sidebar-modern">
      <h2 className="logo">Library</h2>
      <ul>
        <li><FaTachometerAlt /> <Link to="/library/dashboard">Dashboard</Link></li>
        <li><FaBook /> <Link to="/library/books">Book Submissions</Link></li>
        <li><FaUser /> <Link to="/library/profile">Profile</Link></li>
      </ul>
    </div>
  );
}

export default LibrarySidebar;
