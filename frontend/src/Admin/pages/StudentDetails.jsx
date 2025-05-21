import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

// Simulated student database
const dummyStudents = [
  {
    id: 1,
    name: "Amina Yusuf",
    type: "Group",
    department: "Faculty",
    clearanceStatus: "Pending",
    date: "2025-05-01",
    program: "Computer Science",
    level: "Undergraduate",
    phone: "0612345678",
    email: "amina.yusuf@just.edu.so",
  },
  {
    id: 2,
    name: "Mohamed Ali",
    type: "Individual",
    department: "Finance",
    clearanceStatus: "Approved",
    date: "2025-05-03",
    program: "Accounting",
    level: "Undergraduate",
    phone: "0611111111",
    email: "mohamed.ali@just.edu.so",
  },
];

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Convert URL param to integer and fetch matching student
  const student = dummyStudents.find((s) => s.id === parseInt(id));

  if (!student) {
    return (
      <div className="dashboard-wrapper">
        <Sidebar />
        <div className="dashboard-main">
          <h2>Student Not Found</h2>
          <button className="btn-cancel" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <h2>Student Profile</h2>
        <div className="student-card">
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Student ID:</strong> {student.id}</p>
          <p><strong>Program:</strong> {student.program}</p>
          <p><strong>Level:</strong> {student.level}</p>
          <p><strong>Phone:</strong> {student.phone}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Clearance Type:</strong> {student.type}</p>
          <p><strong>Department:</strong> {student.department}</p>
          <p><strong>Status:</strong> <span className={`badge ${student.clearanceStatus.toLowerCase()}`}>{student.clearanceStatus}</span></p>
          <p><strong>Requested On:</strong> {student.date}</p>
        </div>
        <button className="btn-cancel" onClick={() => navigate(-1)}>← Back to Requests</button>
      </div>
    </div>
  );
}

export default StudentDetails;
