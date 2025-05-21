<<<<<<< HEAD
import React from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const clearances = [
  { student: "Kathryn Murphy", type: "Group", dept: "Faculty", status: "Pending", date: "8/15/2023" },
  { student: "Eleanor Pena", type: "Individual", dept: "Library", status: "Cleared", date: "5/23/2023" },
  { student: "Savannah Nguyen", type: "Group", dept: "Finance", status: "Scheduled", date: "5/31/2023" },
  { student: "Cody Fischer", type: "Group", dept: "Cleared", status: "Scheduled", date: "5/23/2023" },
  { student: "Floyd Miles", type: "Group", dept: "Group", status: "Pending", date: "5/21/2023" },
  { student: "Theressa Webb", type: "Individual", dept: "Finance", status: "Cleared", date: "6/01/2023" },
];

function Dashboard() {
=======
// import React from "react";
// import Sidebar from "../components/Sidebar";
// import "./Dashboard.css";

// const clearances = [
//   { student: "Kathryn Murphy", type: "Group", dept: "Faculty", status: "Pending", date: "8/15/2023" },
//   { student: "Eleanor Pena", type: "Individual", dept: "Library", status: "Cleared", date: "5/23/2023" },
//   { student: "Savannah Nguyen", type: "Group", dept: "Finance", status: "Scheduled", date: "5/31/2023" },
//   { student: "Cody Fischer", type: "Group", dept: "Cleared", status: "Scheduled", date: "5/23/2023" },
//   { student: "Floyd Miles", type: "Group", dept: "Group", status: "Pending", date: "5/21/2023" },
//   { student: "Theressa Webb", type: "Individual", dept: "Finance", status: "Cleared", date: "6/01/2023" },
// ];

// function Dashboard() {
//   return (
//     <div className="dashboard-wrapper">
//       <Sidebar />
//       <div className="dashboard-main">
//         <div className="cards">
//           <div className="card blue">5 <span>Pending</span></div>
//           <div className="card green">12 <span>Cleared</span></div>
//           <div className="card yellow">3 <span>Scheduled</span></div>
//         </div>

//         <h2>Clearances</h2>
//         <table>
//           <thead>
//             <tr>
//               <th>Student</th>
//               <th>Group / Individual</th>
//               <th>Department</th>
//               <th>Status</th>
//               <th>Date</th>
//             </tr>
//           </thead>
//           <tbody>
//             {clearances.map((item, index) => (
//               <tr key={index}>
//                 <td>{item.student}</td>
//                 <td>{item.type}</td>
//                 <td>{item.dept}</td>
//                 <td><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
//                 <td>{item.date}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;


import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState({ pending: 0, nameCorrections: 0, approved: 0 });
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchPending();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/examination/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/examination/pending");
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching examination records", err);
    }
  };

  const handleApprove = async (studentId) => {
    await axios.post("http://localhost:5000/api/examination/approve", {
      studentId,
      approvedBy: "admin-id",
    });
    fetchStats();
    fetchPending();
  };

  const handleReject = async (studentId) => {
    await axios.post("http://localhost:5000/api/examination/reject", {
      studentId,
      remarks: "Incomplete clearance requirements",
    });
    fetchStats();
    fetchPending();
  };

>>>>>>> master
  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
<<<<<<< HEAD
        <div className="cards">
          <div className="card blue">5 <span>Pending</span></div>
          <div className="card green">12 <span>Cleared</span></div>
          <div className="card yellow">3 <span>Scheduled</span></div>
        </div>

        <h2>Clearances</h2>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Group / Individual</th>
              <th>Department</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {clearances.map((item, index) => (
              <tr key={index}>
                <td>{item.student}</td>
                <td>{item.type}</td>
                <td>{item.dept}</td>
                <td><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                <td>{item.date}</td>
              </tr>
            ))}
=======

        {/* Stats */}
        <div className="cards">
          <div className="card blue">
            <div>
              <div>{stats.pending}</div>
              <span>Pending Requests</span>
            </div>
          </div>
          <div className="card yellow">
            <div>
              <div>{stats.nameCorrections}</div>
              <span>Name Correction Requests</span>
            </div>
          </div>
          <div className="card green">
            <div>
              <div>{stats.approved}</div>
              <span>Approved Clearances</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Student Name</th>
              <th>ID</th>
              <th>Program</th>
              <th>Passed?</th>
              <th>Can Graduate?</th>
              <th>Name Correction?</th>
              <th>Docs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((item, index) => {
              const s = item.studentId || {};
              const docsOk =
                item.requiredDocs?.passportUploaded && item.requiredDocs?.otherDocsVerified;

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{s.fullName}</td>
                  <td>{s.studentId}</td>
                  <td>{s.program}</td>
                  <td>{item.hasPassedAllCourses ? "✅" : "❌"}</td>
                  <td>{item.canGraduate ? "✅" : "❌"}</td>
                  <td>{item.nameCorrectionDoc ? "✅" : "❌"}</td>
                  <td>{docsOk ? "✅ Verified" : "❌ Incomplete"}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.status === "Approved"
                          ? "approved"
                          : item.status === "Rejected"
                          ? "rejected"
                          : "pending"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === "Pending" && (
                      <>
                        <button className="btn-approve" onClick={() => handleApprove(s._id)}>
                          Approve
                        </button>
                        <button className="btn-reject" onClick={() => handleReject(s._id)}>
                          Reject
                        </button>
                      </>
                    )}
                    {item.status === "Approved" && (
                      <button className="btn-view">View Certificate</button>
                    )}
                  </td>
                </tr>
              );
            })}
>>>>>>> master
          </tbody>
        </table>
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default Dashboard;
=======
export default Dashboard;
>>>>>>> master
