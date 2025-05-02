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
  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;