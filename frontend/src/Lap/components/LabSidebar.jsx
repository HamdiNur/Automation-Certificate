import React from "react";
import { Link } from "react-router-dom";
<<<<<<< HEAD
import { FaTachometerAlt, FaClipboardCheck, FaUser,FaCheckCircle,FaTimesCircle,FaUsers  } from "react-icons/fa";

=======
import { FaTachometerAlt, FaClipboardCheck, FaUser } from "react-icons/fa";
>>>>>>> master
import "./LabSidebar.css";
function LabSidebar() {
  return (
    <div className="sidebar-modern">
      <h2 className="logo">Lab Portal</h2>
      <ul>
        <li><FaTachometerAlt /> <Link to="/lab/dashboard">Dashboard</Link></li>
<<<<<<< HEAD
        <Link to="/lab/dashboard" className="sidebar-link">
        
            <i className="fas fa-clock"></i> Pending Submissions
          </Link>
      <li>
  <FaCheckCircle />
  <Link to="/lab/approved">Approved returns</Link>

</li>
        <li><FaTimesCircle /> <Link to="/lab/rejected">Rejected returns</Link></li>

                <li><FaUsers /> <Link to="/lab/students">Student List</Link></li>

        



           
                   <li><FaUser /> <Link to="/lab/profile">Profile</Link></li>


=======
        <li><FaClipboardCheck /> <Link to="/lab/equipment">Equipment Check</Link></li>
        <li><FaUser /> <Link to="/lab/profile">Profile</Link></li>
>>>>>>> master
      </ul>
    </div>
  );
}

export default LabSidebar;
