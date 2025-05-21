import React from "react";
import { Link } from "react-router-dom";
<<<<<<< HEAD
import {
  FaTachometerAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaFolderOpen,
  FaUsers,
  FaUser,
} from "react-icons/fa";
=======
import { FaTachometerAlt, FaBook, FaUser } from "react-icons/fa";
>>>>>>> master
import "./LibrarySidebar.css";

function LibrarySidebar() {
  return (
    <div className="sidebar-modern">
<<<<<<< HEAD
      <h2 className="logo">Library Panel</h2>
      <ul>
        <li><FaTachometerAlt /> <Link to="/library/dashboard">Dashboard</Link></li>
        <li>
      <Link to="/library/dashboard" className="sidebar-link">
    <i className="fas fa-clock"></i> Pending Submissions
  </Link>
   </li>       <li><FaCheckCircle /> <Link to="/library/approved">Approved Submissions</Link></li>
        <li><FaTimesCircle /> <Link to="/library/rejected">Rejected Submissions</Link></li>
        <li><FaFolderOpen /> <Link to="/library/groups">Group Details</Link></li>
        <li><FaUsers /> <Link to="/library/students">Student List</Link></li>
        <li><FaUser /> <Link to="/library/profile">My Profile</Link></li>
=======
      <h2 className="logo">Library</h2>
      <ul>
        <li><FaTachometerAlt /> <Link to="/library/dashboard">Dashboard</Link></li>
        <li><FaBook /> <Link to="/library/books">Book Submissions</Link></li>
        <li><FaUser /> <Link to="/library/profile">Profile</Link></li>
>>>>>>> master
      </ul>
    </div>
  );
}

export default LibrarySidebar;
