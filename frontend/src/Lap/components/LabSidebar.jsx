import React from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaClipboardCheck,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers
} from "react-icons/fa";
import "./LabSidebar.css";

function LabSidebar() {
  return (
    <div className="sidebar-modern">
      <h2 className="logo">Lab Portal</h2>
      <ul>
        <li>
          <FaTachometerAlt />
          <Link to="/lab/dashboard">Dashboard</Link>
        </li>

        <li>
          <FaClipboardCheck />
          <Link to="/lab/dashboard" className="sidebar-link">
            Pending Submissions
          </Link>
        </li>

        <li>
          <FaCheckCircle />
          <Link to="/lab/approved">Approved Returns</Link>
        </li>

        <li>
          <FaTimesCircle />
          <Link to="/lab/rejected">Rejected Returns</Link>
        </li>

        <li>
          <FaUsers />
          <Link to="/lab/students">Student List</Link>
        </li>

        <li>
          <FaUser />
          <Link to="/lab/profile">Profile</Link>
        </li>
        
      </ul>
    </div>
  );
}

export default LabSidebar;